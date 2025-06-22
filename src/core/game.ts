import { HexCoordinate, HexUtils } from './hex';
import { HexRenderer } from './renderer';
import { SettlerSystem } from '../entities/settler';
import { CitySystem } from '../entities/city';
import { InputSystem } from '../systems/input';

export class Game {
  private renderer: HexRenderer;
  private settlerSystem: SettlerSystem;
  private citySystem: CitySystem;
  private inputSystem: InputSystem;
  private settleButton: HTMLButtonElement | null = null;
  private managementBar: HTMLDivElement | null = null;
  private leftSidebar: HTMLDivElement | null = null;
  private gameTickInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new HexRenderer(container);
    this.settlerSystem = new SettlerSystem();
    this.citySystem = new CitySystem(this.renderer.getWorldGenerator());
    this.inputSystem = new InputSystem(
      this.renderer.getCanvas(),
      () => this.renderer.getCameraOffset()
    );

    this.setupUI(container);
    this.setupInputHandling();
    this.render();
  }

  private setupInputHandling() {
    this.inputSystem.setClickHandler((hex: HexCoordinate) => {
      const settler = this.settlerSystem.getSettler();
      const distance = HexUtils.hexDistance(settler.position, hex);
      
      // Only allow movement to adjacent hexes
      if (distance === 1 && this.settlerSystem.canMove()) {
        const fromHex = settler.position;
        const success = this.settlerSystem.moveSettler(hex);
        if (success) {
          console.log(`Settler moved to ${hex.q}, ${hex.r}`);
          
          // Animate the movement
          this.renderer.animateSettlerMovement(fromHex, hex, this.settlerSystem.getSettler(), () => {
            this.updateVisibility();
          });
        }
      } else if (distance > 1) {
        console.log('Can only move to adjacent hexes');
      } else if (!this.settlerSystem.canMove()) {
        console.log('Settler cannot move (no food remaining)');
      }
    });
  }

  private updateVisibility() {
    const settler = this.settlerSystem.getSettler();
    this.renderer.updateVisibility(settler.position, 2);
  }

  private setupUI(container: HTMLElement) {
    // Create UI container for game controls
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '10px';
    uiContainer.style.left = '10px';
    uiContainer.style.zIndex = '1000';
    uiContainer.style.display = 'flex';
    uiContainer.style.gap = '10px';
    
    // Settle button
    this.settleButton = document.createElement('button');
    this.settleButton.textContent = 'Settle Here';
    this.settleButton.style.padding = '8px 16px';
    this.settleButton.style.backgroundColor = '#4CAF50';
    this.settleButton.style.color = 'white';
    this.settleButton.style.border = 'none';
    this.settleButton.style.borderRadius = '4px';
    this.settleButton.style.cursor = 'pointer';
    this.settleButton.style.fontSize = '14px';
    
    this.settleButton.addEventListener('click', () => this.settleCity());
    
    uiContainer.appendChild(this.settleButton);
    container.appendChild(uiContainer);
    
    this.updateUI();
  }

  private settleCity() {
    if (this.citySystem.hasCity()) {
      console.log('City already exists!');
      return;
    }

    const settler = this.settlerSystem.getSettler();
    console.log(`Founding city at ${settler.position.q}, ${settler.position.r}`);
    
    const city = this.citySystem.foundCity(settler.position, settler.food);
    
    // Animate zoom in to city view and then render city
    this.renderer.animateZoom(2.0, 1000, () => {
      this.renderer.renderCity(city);
      this.updateUI();
      this.setupLeftSidebar();
      this.setupCityManagement();
      this.startGameTick();
    });
    
    console.log('City founded successfully!', city);
  }

  private updateUI() {
    if (!this.settleButton) return;
    
    const hasCity = this.citySystem.hasCity();
    this.settleButton.style.display = hasCity ? 'none' : 'block';
    
    if (hasCity) {
      const city = this.citySystem.getCity()!;
      // Update button or add city info display
      this.settleButton.textContent = `${city.name} (Pop: ${city.population})`;
      this.settleButton.style.backgroundColor = '#2196F3';
      this.settleButton.style.display = 'block';
      this.settleButton.style.cursor = 'default';
    }
  }

  private setupLeftSidebar() {
    if (this.leftSidebar) return; // Already exists
    
    const city = this.citySystem.getCity();
    if (!city) return;

    // Create left sidebar for buildings and worker management
    this.leftSidebar = document.createElement('div');
    this.leftSidebar.style.position = 'fixed';
    this.leftSidebar.style.left = '0';
    this.leftSidebar.style.top = '0';
    this.leftSidebar.style.bottom = '0';
    this.leftSidebar.style.width = '300px';
    this.leftSidebar.style.backgroundColor = '#2c3e50';
    this.leftSidebar.style.borderRight = '2px solid #34495e';
    this.leftSidebar.style.zIndex = '1000';
    this.leftSidebar.style.overflowY = 'auto';
    this.leftSidebar.style.padding = '15px';
    this.leftSidebar.style.boxShadow = '2px 0 10px rgba(0,0,0,0.3)';
    this.leftSidebar.style.color = 'white';

    this.updateLeftSidebar();
    document.body.appendChild(this.leftSidebar);
    
    // Add event listeners for worker assignment buttons
    this.setupWorkerButtons();
  }

  private updateLeftSidebar() {
    if (!this.leftSidebar) return;
    
    const city = this.citySystem.getCity();
    if (!city) return;

    // Group buildings by type and count them
    const buildingCounts = new Map<string, { count: number; totalWorkers: number; maxWorkers: number; buildingType: any }>();
    
    city.buildings.filter(b => b.type !== 'town_hall').forEach(building => {
      const buildingType = this.citySystem.getBuildingTypes().find(bt => bt.id === building.type);
      const existing = buildingCounts.get(building.type) || { count: 0, totalWorkers: 0, maxWorkers: 0, buildingType };
      
      buildingCounts.set(building.type, {
        count: existing.count + 1,
        totalWorkers: existing.totalWorkers + building.assignedWorkers,
        maxWorkers: existing.maxWorkers + building.maxWorkers,
        buildingType
      });
    });

    const buildingsList = Array.from(buildingCounts.entries()).map(([buildingTypeId, data]) => {
      if (data.maxWorkers > 0) {
        // Building type that can have workers - stack layout
        return `<div style="font-size: 13px; margin: 4px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 500;">${data.buildingType?.icon || '🏗️'} ${data.buildingType?.name || buildingTypeId}</span>
            <span style="color: #bdc3c7; font-size: 12px;">(${data.count})</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 12px; color: #95a5a6;">Workers: ${data.totalWorkers}/${data.maxWorkers}</span>
            <div style="display: flex; align-items: center; gap: 6px; min-width: 50px; justify-content: flex-end;">
              ${data.totalWorkers > 0 ? `<button class="worker-btn" data-action="unassign" data-building-type="${buildingTypeId}" 
                      style="width: 22px; height: 22px; font-size: 12px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;">-</button>` : ''}
              ${(data.totalWorkers < data.maxWorkers && city.availableWorkers > 0) ? `<button class="worker-btn" data-action="assign" data-building-type="${buildingTypeId}"
                      style="width: 22px; height: 22px; font-size: 12px; background: #27ae60; color: white; border: none; border-radius: 3px; cursor: pointer;">+</button>` : ''}
            </div>
          </div>
        </div>`;
      } else {
        // Building type that doesn't use workers - compact layout
        return `<div style="font-size: 13px; margin: 4px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 500;">${data.buildingType?.icon || '🏗️'} ${data.buildingType?.name || buildingTypeId}</span>
          <span style="color: #bdc3c7; font-size: 12px;">(${data.count})</span>
        </div>`;
      }
    }).join('');
    
    this.leftSidebar.innerHTML = `
      <h2 style="margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #34495e; padding-bottom: 10px;">${city.name}</h2>
      
      <div style="margin-bottom: 20px; padding: 10px; background: #34495e; border-radius: 6px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">📊 City Status</h3>
        <div style="font-size: 14px;">
          <div style="margin: 4px 0;">Population: <span style="color: #f39c12; font-weight: bold;">${city.population}/${city.maxPopulation}</span></div>
          <div style="margin: 4px 0;">Available Workers: <span style="color: #2ecc71; font-weight: bold;">${city.availableWorkers}</span></div>
          <div style="margin: 4px 0;">Integrity: <span style="color: #e74c3c; font-weight: bold;">${city.integrity}</span></div>
        </div>
      </div>

      <div style="margin-bottom: 20px; padding: 10px; background: #34495e; border-radius: 6px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">💰 Resources</h3>
        <div style="font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <div>Food: <span style="color: #2ecc71; font-weight: bold;">${city.resources.food}/${city.storage.food}</span></div>
          <div>Wood: <span style="color: #8b4513; font-weight: bold;">${city.resources.wood}/${city.storage.wood}</span></div>
          <div>Stone: <span style="color: #95a5a6; font-weight: bold;">${city.resources.stone}/${city.storage.stone}</span></div>
          <div>Research: <span style="color: #9b59b6; font-weight: bold;">${city.resources.research}</span></div>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px;">🏘️ Buildings</h3>
          <button id="unassign-all" style="padding: 6px 12px; font-size: 12px; background: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer;">Unassign All</button>
        </div>
        <div style="max-height: calc(100vh - 400px); overflow-y: auto;">
          ${buildingsList || '<div style="font-size: 14px; color: #7f8c8d; text-align: center; padding: 30px;">No buildings yet</div>'}
        </div>
      </div>
    `;
  }

  private setupCityManagement() {
    if (this.managementBar) return; // Already exists
    
    const city = this.citySystem.getCity();
    if (!city) return;

    // Create simplified bottom management bar for construction only
    this.managementBar = document.createElement('div');
    this.managementBar.style.position = 'fixed';
    this.managementBar.style.bottom = '0';
    this.managementBar.style.left = '300px'; // Account for left sidebar
    this.managementBar.style.right = '0';
    this.managementBar.style.height = '80px';
    this.managementBar.style.backgroundColor = '#2c3e50';
    this.managementBar.style.borderTop = '2px solid #34495e';
    this.managementBar.style.display = 'flex';
    this.managementBar.style.alignItems = 'center';
    this.managementBar.style.padding = '15px';
    this.managementBar.style.gap = '10px';
    this.managementBar.style.zIndex = '1000';
    this.managementBar.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.3)';

    const availableBuildings = this.citySystem.getBuildingTypes();
    const buildButtons = availableBuildings.map(buildingType => {
      const canBuild = this.citySystem.canBuildBuilding(buildingType.id);
      const button = document.createElement('button');
      button.textContent = `${buildingType.icon} ${buildingType.name}`;
      button.style.padding = '8px 16px';
      button.style.fontSize = '14px';
      button.style.border = 'none';
      button.style.borderRadius = '6px';
      button.style.cursor = canBuild.canBuild ? 'pointer' : 'not-allowed';
      button.style.backgroundColor = canBuild.canBuild ? '#27ae60' : '#7f8c8d';
      button.style.color = canBuild.canBuild ? 'white' : '#bdc3c7';
      button.style.fontWeight = '600';
      button.style.minWidth = '120px';
      
      if (!canBuild.canBuild) {
        button.title = canBuild.reason || 'Cannot build';
        button.disabled = true;
      } else {
        const currentCost = this.citySystem.getCurrentBuildingCost(buildingType.id);
        const costText = Object.entries(currentCost)
          .map(([resource, amount]) => `${amount} ${resource}`)
          .join(', ');
        button.title = `${buildingType.description}\nCost: ${costText}`;
        button.addEventListener('click', () => this.buildBuilding(buildingType.id));
      }
      
      return button;
    });

    // Add construction header
    const headerDiv = document.createElement('div');
    headerDiv.style.color = 'white';
    headerDiv.style.fontSize = '18px';
    headerDiv.style.fontWeight = '600';
    headerDiv.style.marginRight = '20px';
    headerDiv.textContent = '🔨 Build:';

    this.managementBar.appendChild(headerDiv);
    buildButtons.forEach(button => this.managementBar!.appendChild(button));

    document.body.appendChild(this.managementBar);
  }

  private buildBuilding(buildingTypeId: string) {
    const result = this.citySystem.buildBuilding(buildingTypeId);
    if (result.success) {
      console.log(`Built ${result.building?.name} successfully!`);
      this.refreshManagementBar();
    } else {
      console.log(`Failed to build: ${result.error}`);
      // Could show a notification to the user here
    }
  }

  private setupWorkerButtons() {
    if (!this.leftSidebar) return;
    
    // Worker assignment buttons
    const workerButtons = this.leftSidebar.querySelectorAll('.worker-btn');
    workerButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const action = target.dataset.action;
        const buildingType = target.dataset.buildingType;
        
        if (!action || !buildingType) return;
        
        if (action === 'assign') {
          if (this.citySystem.assignWorkerToType(buildingType)) {
            console.log('Worker assigned to', buildingType);
            console.log('Worker info:', this.citySystem.getWorkerInfo());
            this.refreshManagementBar();
          }
        } else if (action === 'unassign') {
          if (this.citySystem.unassignWorkerFromType(buildingType)) {
            console.log('Worker unassigned from', buildingType);
            console.log('Worker info:', this.citySystem.getWorkerInfo());
            this.refreshManagementBar();
          }
        }
      });
    });

    // Unassign all button
    const unassignAllBtn = this.leftSidebar.querySelector('#unassign-all');
    if (unassignAllBtn) {
      unassignAllBtn.addEventListener('click', () => {
        this.citySystem.unassignAllWorkers();
        console.log('All workers unassigned');
        console.log('Worker info:', this.citySystem.getWorkerInfo());
        this.refreshManagementBar();
      });
    }
  }

  private refreshManagementBar() {
    // Update left sidebar
    this.updateLeftSidebar();
    this.setupWorkerButtons();
    
    // Refresh bottom bar
    if (this.managementBar) {
      document.body.removeChild(this.managementBar);
      this.managementBar = null;
      this.setupCityManagement();
    }
  }

  private startGameTick() {
    if (this.gameTickInterval) return; // Already running
    
    // Generate resources every 2 seconds
    this.gameTickInterval = window.setInterval(() => {
      if (this.citySystem.hasCity()) {
        this.citySystem.generateResources();
        this.refreshManagementBar();
      }
    }, 2000);
  }

  private render() {
    const settler = this.settlerSystem.getSettler();
    
    if (!this.citySystem.hasCity()) {
      this.renderer.renderSettler(settler);
    } else {
      const city = this.citySystem.getCity()!;
      this.renderer.renderCity(city);
    }
  }

  destroy() {
    this.inputSystem.destroy();
    this.renderer.destroy();
    
    // Clean up game tick
    if (this.gameTickInterval) {
      clearInterval(this.gameTickInterval);
      this.gameTickInterval = null;
    }
    
    // Clean up management bar
    if (this.managementBar) {
      document.body.removeChild(this.managementBar);
      this.managementBar = null;
    }
    
    // Clean up left sidebar
    if (this.leftSidebar) {
      document.body.removeChild(this.leftSidebar);
      this.leftSidebar = null;
    }
  }
}