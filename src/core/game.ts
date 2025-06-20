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

  constructor(container: HTMLElement) {
    this.renderer = new HexRenderer(container);
    this.settlerSystem = new SettlerSystem();
    this.citySystem = new CitySystem();
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
      this.setupCityManagement();
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

  private setupCityManagement() {
    if (this.managementBar) return; // Already exists
    
    const city = this.citySystem.getCity();
    if (!city) return;

    // Create bottom management bar
    this.managementBar = document.createElement('div');
    this.managementBar.style.position = 'fixed';
    this.managementBar.style.bottom = '0';
    this.managementBar.style.left = '0';
    this.managementBar.style.right = '0';
    this.managementBar.style.height = '120px';
    this.managementBar.style.backgroundColor = '#2c3e50';
    this.managementBar.style.borderTop = '2px solid #34495e';
    this.managementBar.style.display = 'flex';
    this.managementBar.style.alignItems = 'center';
    this.managementBar.style.padding = '10px 20px';
    this.managementBar.style.zIndex = '1000';
    this.managementBar.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.3)';

    // City info section
    const cityInfo = document.createElement('div');
    cityInfo.style.color = 'white';
    cityInfo.style.marginRight = '30px';
    cityInfo.style.minWidth = '200px';
    cityInfo.innerHTML = `
      <h3 style="margin: 0 0 5px 0; font-size: 18px;">${city.name}</h3>
      <div style="font-size: 14px;">
        <div>Population: <span style="color: #f39c12;">${city.population}</span></div>
        <div>Integrity: <span style="color: #e74c3c;">${city.integrity}</span></div>
        <div>Buildings: <span style="color: #3498db;">${city.buildings.length}</span></div>
      </div>
    `;

    // Resources section
    const resourcesDiv = document.createElement('div');
    resourcesDiv.style.color = 'white';
    resourcesDiv.style.marginRight = '20px';
    resourcesDiv.style.minWidth = '180px';
    resourcesDiv.innerHTML = `
      <h4 style="margin: 0 0 5px 0; font-size: 16px;">Resources</h4>
      <div style="font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px;">
        <div>Food: <span style="color: #2ecc71;">${city.resources.food}/${city.storage.food}</span></div>
        <div>Wood: <span style="color: #8b4513;">${city.resources.wood}/${city.storage.wood}</span></div>
        <div>Stone: <span style="color: #95a5a6;">${city.resources.stone}/${city.storage.stone}</span></div>
        <div>Workers: <span style="color: #f39c12;">${city.availableWorkers}</span></div>
      </div>
    `;

    // Buildings section (left side)
    const buildingsDiv = document.createElement('div');
    buildingsDiv.style.color = 'white';
    buildingsDiv.style.marginRight = '20px';
    buildingsDiv.style.minWidth = '250px';
    buildingsDiv.style.maxHeight = '100px';
    buildingsDiv.style.overflowY = 'auto';
    
    const buildingsList = city.buildings.filter(b => b.type !== 'town_hall').map(building => {
      const buildingType = this.citySystem.getBuildingTypes().find(bt => bt.id === building.type);
      const workerInfo = building.maxWorkers > 0 ? ` (${building.assignedWorkers}/${building.maxWorkers}👷)` : '';
      return `<div style="font-size: 12px; margin: 2px 0; padding: 2px 4px; background: rgba(255,255,255,0.1); border-radius: 3px;">
        ${buildingType?.icon || '🏗️'} ${building.name}${workerInfo}
      </div>`;
    }).join('');
    
    buildingsDiv.innerHTML = `
      <h4 style="margin: 0 0 5px 0; font-size: 16px;">Buildings (${city.buildings.length - 1})</h4>
      <div style="max-height: 60px; overflow-y: auto;">
        ${buildingsList || '<div style="font-size: 12px; color: #7f8c8d;">No buildings yet</div>'}
      </div>
    `;

    // Build options section (right side)
    const buildOptionsDiv = document.createElement('div');
    buildOptionsDiv.style.marginLeft = 'auto';
    buildOptionsDiv.style.color = 'white';
    buildOptionsDiv.style.minWidth = '300px';
    
    const availableBuildings = this.citySystem.getBuildingTypes();
    const buildButtons = availableBuildings.map(buildingType => {
      const canBuild = this.citySystem.canBuildBuilding(buildingType.id);
      const button = document.createElement('button');
      button.textContent = `${buildingType.icon} ${buildingType.name}`;
      button.style.padding = '4px 8px';
      button.style.margin = '1px';
      button.style.fontSize = '11px';
      button.style.border = 'none';
      button.style.borderRadius = '3px';
      button.style.cursor = canBuild.canBuild ? 'pointer' : 'not-allowed';
      button.style.backgroundColor = canBuild.canBuild ? '#27ae60' : '#7f8c8d';
      button.style.color = canBuild.canBuild ? 'white' : '#bdc3c7';
      
      if (!canBuild.canBuild) {
        button.title = canBuild.reason || 'Cannot build';
        button.disabled = true;
      } else {
        const costText = Object.entries(buildingType.cost)
          .map(([resource, amount]) => `${amount} ${resource}`)
          .join(', ');
        button.title = `${buildingType.description}\nCost: ${costText}`;
        button.addEventListener('click', () => this.buildBuilding(buildingType.id));
      }
      
      return button;
    });

    buildOptionsDiv.innerHTML = `<h4 style="margin: 0 0 5px 0; font-size: 16px;">Build</h4>`;
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.gap = '2px';
    buildButtons.forEach(button => buttonContainer.appendChild(button));
    buildOptionsDiv.appendChild(buttonContainer);

    this.managementBar.appendChild(cityInfo);
    this.managementBar.appendChild(resourcesDiv);
    this.managementBar.appendChild(buildingsDiv);
    this.managementBar.appendChild(buildOptionsDiv);

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

  private refreshManagementBar() {
    if (this.managementBar) {
      // Remove and recreate the management bar with updated info
      document.body.removeChild(this.managementBar);
      this.managementBar = null;
      this.setupCityManagement();
    }
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
    
    // Clean up management bar
    if (this.managementBar) {
      document.body.removeChild(this.managementBar);
      this.managementBar = null;
    }
  }
}