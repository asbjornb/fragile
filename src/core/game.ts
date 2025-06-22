import { HexCoordinate, HexUtils } from './hex';
import { HexRenderer } from './renderer';
import { SettlerSystem } from '../entities/settler';
import { CitySystem } from '../entities/city';
import { InputSystem } from '../systems/input';
import { StorySystem } from '../systems/events';

export class Game {
  private renderer: HexRenderer;
  private settlerSystem: SettlerSystem;
  private citySystem: CitySystem;
  private inputSystem: InputSystem;
  private storySystem: StorySystem;
  private settleButton: HTMLButtonElement | null = null;
  private managementBar: HTMLDivElement | null = null;
  private leftSidebar: HTMLDivElement | null = null;
  private storyPanel: HTMLDivElement | null = null;
  private gameTickInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new HexRenderer(container);
    this.settlerSystem = new SettlerSystem();
    this.citySystem = new CitySystem(this.renderer.getWorldGenerator());
    this.storySystem = new StorySystem();
    this.inputSystem = new InputSystem(
      this.renderer.getCanvas(),
      () => this.renderer.getCameraOffset()
    );

    this.setupUI(container);
    this.setupInputHandling();
    this.setupStorySystem();
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
    
    // Trigger story message for city founding
    this.storySystem.cityFounded();
    
    // Animate zoom in to city view and then render city
    this.renderer.animateZoom(2.0, 1000, () => {
      this.render(); // Use render method instead of renderCity directly
      this.updateUI();
      this.setupLeftSidebar();
      this.setupCityManagement();
      this.setupStoryPanel();
      this.startGameTick();
    });
    
    console.log('City founded successfully!', city);
  }

  private updateUI() {
    if (!this.settleButton) return;
    
    const hasCity = this.citySystem.hasCity();
    
    if (hasCity) {
      // Hide settle button completely when city exists
      this.settleButton.style.display = 'none';
    } else {
      // Show settle button during exploration
      this.settleButton.style.display = 'block';
      this.settleButton.textContent = 'Settle Here';
      this.settleButton.style.backgroundColor = '#4CAF50';
      this.settleButton.style.cursor = 'pointer';
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
    this.leftSidebar.style.bottom = '80px'; // Leave space for bottom bar
    this.leftSidebar.style.width = '300px';
    this.leftSidebar.style.backgroundColor = '#2c3e50';
    this.leftSidebar.style.zIndex = '900';
    this.leftSidebar.style.overflowY = 'auto';
    this.leftSidebar.style.padding = '15px';
    this.leftSidebar.style.color = 'white';

    this.updateLeftSidebar();
    document.body.appendChild(this.leftSidebar);
    
    // Add event listeners for worker assignment buttons
    this.setupWorkerButtons();
  }

  private getTerrainBonusRadius(): number {
    // Base radius of 1 (adjacent tiles + center)
    // This can be extended later by tech/buildings
    return 1;
  }

  private getTerrainBonuses(cityPosition: HexCoordinate): { food: number; wood: number; stone: number } {
    const radius = this.getTerrainBonusRadius();
    let bonuses = { food: 0, wood: 0, stone: 0 };

    // Get all hexes within radius (including center tile)
    const hexesToCheck: HexCoordinate[] = [];
    
    // Add center tile (the city tile itself)
    hexesToCheck.push(cityPosition);
    
    // Add tiles within radius
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
        const hex = { q: cityPosition.q + q, r: cityPosition.r + r };
        
        // Skip center tile (already added)
        if (hex.q === cityPosition.q && hex.r === cityPosition.r) continue;
        
        // Only include if within actual radius
        if (HexUtils.hexDistance(cityPosition, hex) <= radius) {
          hexesToCheck.push(hex);
        }
      }
    }

    hexesToCheck.forEach((coord: HexCoordinate) => {
      const tile = this.renderer.getWorldGenerator().getTile(coord);
      if (!tile) return;

      switch (tile.type.id) {
        case 'plains':
          bonuses.food += 5; // +5% per plains
          break;
        case 'forest':
          bonuses.wood += 10; // +10% per forest
          break;
        case 'hill':
        case 'mountain':
          bonuses.stone += 20; // +20% per hill/mountain
          break;
      }
    });

    return bonuses;
  }

  private updateLeftSidebar() {
    if (!this.leftSidebar) return;
    
    const city = this.citySystem.getCity();
    if (!city) return;

    // Get terrain bonuses
    const bonuses = this.getTerrainBonuses(city.position);

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
              <button class="worker-btn" data-action="unassign" data-building-type="${buildingTypeId}" 
                      style="width: 22px; height: 22px; font-size: 12px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; ${data.totalWorkers > 0 ? '' : 'visibility: hidden;'}">-</button>
              <button class="worker-btn" data-action="assign" data-building-type="${buildingTypeId}"
                      style="width: 22px; height: 22px; font-size: 12px; background: #27ae60; color: white; border: none; border-radius: 3px; cursor: pointer; ${(data.totalWorkers < data.maxWorkers && city.availableWorkers > 0) ? '' : 'visibility: hidden;'}">+</button>
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
          <div>Food: <span style="color: #2ecc71; font-weight: bold;">${city.resources.food}/${city.storage.food}</span>${bonuses.food > 0 ? ` <span style="color: #f39c12; font-size: 11px;">(+${bonuses.food}%)</span>` : ''}</div>
          <div>Wood: <span style="color: #8b4513; font-weight: bold;">${city.resources.wood}/${city.storage.wood}</span>${bonuses.wood > 0 ? ` <span style="color: #f39c12; font-size: 11px;">(+${bonuses.wood}%)</span>` : ''}</div>
          <div>Stone: <span style="color: #95a5a6; font-weight: bold;">${city.resources.stone}/${city.storage.stone}</span>${bonuses.stone > 0 ? ` <span style="color: #f39c12; font-size: 11px;">(+${bonuses.stone}%)</span>` : ''}</div>
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
    this.managementBar.style.left = '0';
    this.managementBar.style.right = '0';
    this.managementBar.style.height = '80px';
    this.managementBar.style.backgroundColor = '#2c3e50';
    this.managementBar.style.borderTop = '1px solid #34495e';
    this.managementBar.style.display = 'flex';
    this.managementBar.style.alignItems = 'center';
    this.managementBar.style.justifyContent = 'center';
    this.managementBar.style.padding = '15px 320px'; // Account for left and right panels
    this.managementBar.style.gap = '10px';
    this.managementBar.style.zIndex = '1000';

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
        this.updateLeftSidebar(); // Update sidebar with terrain bonuses
        this.setupWorkerButtons(); // Re-setup event listeners after innerHTML update
        
        // Update city UI with current resources 
        const city = this.citySystem.getCity()!;
        this.renderer.updateCityUI(city);
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

  private setupStorySystem() {
    // Listen for new story messages and update the UI
    this.storySystem.onMessage((message) => {
      this.updateStoryPanel();
    });

    // Set up building unlock callback
    this.citySystem.setStoryCallback((buildingName: string) => {
      this.storySystem.buildingUnlocked(buildingName);
    });
  }

  private setupStoryPanel() {
    if (this.storyPanel) return; // Already exists

    this.storyPanel = document.createElement('div');
    this.storyPanel.style.position = 'fixed';
    this.storyPanel.style.top = '0';
    this.storyPanel.style.right = '0';
    this.storyPanel.style.bottom = '80px'; // Leave space for bottom bar
    this.storyPanel.style.width = '320px';
    this.storyPanel.style.backgroundColor = '#2c3e50';
    this.storyPanel.style.color = '#ecf0f1';
    this.storyPanel.style.fontFamily = 'Arial, sans-serif';
    this.storyPanel.style.fontSize = '13px';
    this.storyPanel.style.lineHeight = '1.4';
    this.storyPanel.style.zIndex = '900';
    this.storyPanel.style.display = 'flex';
    this.storyPanel.style.flexDirection = 'column';

    // Header
    const header = document.createElement('div');
    header.style.padding = '15px 15px 10px 15px';
    header.style.borderBottom = '1px solid #34495e';
    header.style.fontWeight = 'bold';
    header.style.color = '#f39c12';
    header.innerHTML = '📖 Settlement Chronicle';

    // Messages container (scrollable)
    const messagesContainer = document.createElement('div');
    messagesContainer.style.flex = '1';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.padding = '10px 15px';
    messagesContainer.id = 'story-messages';

    this.storyPanel.appendChild(header);
    this.storyPanel.appendChild(messagesContainer);
    document.body.appendChild(this.storyPanel);
    
    this.updateStoryPanel();
  }

  private updateStoryPanel() {
    if (!this.storyPanel) return;

    const messagesContainer = this.storyPanel.querySelector('#story-messages');
    if (!messagesContainer) return;

    const messages = this.storySystem.getMessages();
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = '<div style="color: #7f8c8d; text-align: center; padding: 20px; font-style: italic;">Your settlement\'s story begins...</div>';
      return;
    }

    // Build all messages HTML
    const messagesHTML = messages.map((message, index) => {
      const timeAgo = this.getTimeAgo(message.timestamp);
      const isLatest = index === messages.length - 1;
      
      return `
        <div style="margin-bottom: 15px; padding: 12px; background: ${isLatest ? 'rgba(241, 196, 15, 0.1)' : 'rgba(255,255,255,0.05)'}; border-radius: 6px; border-left: 3px solid ${isLatest ? '#f1c40f' : '#34495e'};">
          <div style="font-weight: bold; color: #f39c12; margin-bottom: 6px; font-size: 12px;">
            ${this.getStoryTitle(message.id)} <span style="color: #95a5a6; font-weight: normal; float: right;">${timeAgo}</span>
          </div>
          <div style="color: #ecf0f1; clear: both;">
            ${message.text}
          </div>
        </div>
      `;
    }).join('');

    messagesContainer.innerHTML = messagesHTML;
    
    // Auto-scroll to bottom to show latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  }

  private getStoryTitle(messageId: string): string {
    const titles: { [key: string]: string } = {
      'city_founded': 'Settlement Founded',
      'building_shed': 'New Construction',
      'building_lumber_yard': 'Industrial Progress',
      'building_quarry': 'Mining Operations',
      'building_farm': 'Agricultural Development',
      'pop_2': 'New Arrivals',
      'pop_5': 'Growing Community',
      'pop_10': 'Thriving Village'
    };
    
    return titles[messageId] || 'Settlement News';
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
    
    // Clean up story panel
    if (this.storyPanel) {
      document.body.removeChild(this.storyPanel);
      this.storyPanel = null;
    }
  }
}