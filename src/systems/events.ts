export interface StoryMessage {
  id: string;
  text: string;
  timestamp: number;
}

export class StorySystem {
  private messages: StoryMessage[] = [];
  private messageCallbacks: ((message: StoryMessage) => void)[] = [];

  constructor() {}

  addMessage(id: string, text: string) {
    const message: StoryMessage = {
      id,
      text,
      timestamp: Date.now()
    };
    
    this.messages.push(message);
    
    // Notify listeners
    this.messageCallbacks.forEach(callback => callback(message));
    
    // Keep only last 50 messages to prevent memory growth
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(-50);
    }
  }

  getMessages(): StoryMessage[] {
    return [...this.messages];
  }

  getLatestMessage(): StoryMessage | null {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  onMessage(callback: (message: StoryMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  // Story messages for game milestones
  cityFounded() {
    this.addMessage('city_founded', 'After days of travel, your settler has found the perfect spot. The first foundations are laid, marking the birth of a new settlement.');
  }

  buildingUnlocked(buildingName: string) {
    const messages: Record<string, string> = {
      'shed': 'Your wood stores are overflowing! The settlement\'s carpenter suggests building a shed to properly store the surplus timber.',
      'lumber_yard': 'With growing construction needs, the village elders propose establishing a proper lumber yard to organize wood production.',
      'quarry': 'Stone deposits have been discovered nearby. The miners are eager to establish a quarry to extract this valuable resource.',
      'farm': 'The fertile soil calls for cultivation. Your people are ready to establish proper farmland to secure the settlement\'s food supply.',
      'library': 'Your settlement has grown into a proper community! The wisest citizens propose establishing a library to preserve knowledge and advance learning.',
      'granary': 'Food is going to waste! The elders propose building a granary to preserve your harvest and feed the growing population.',
      'warehouse': 'Stone piles are scattered everywhere. A proper warehouse would keep your building materials organized and protected.',
      'hunters_lodge': 'Your scholars have studied the ways of the wild. Skilled hunters can now venture out to bring back game from the surrounding lands.'
    };

    const message = messages[buildingName] || `The settlement has discovered new construction techniques. ${buildingName} is now available to build.`;
    this.addMessage(`building_${buildingName}`, message);
  }

  techResearched(techName: string, techId: string) {
    const messages: Record<string, string> = {
      'basic_tools': 'Simple but effective tools have been crafted. Workers across the settlement report improved productivity.',
      'advanced_tools': 'The blacksmith has forged superior tools. Your workers can accomplish more with each swing of the hammer.',
      'specialized_tools': 'Master craftsmen have designed tools tailored to each profession. Efficiency has never been higher.',
      'agriculture': 'Farmers have discovered new techniques for tilling the soil. Crop yields are beginning to improve.',
      'crop_rotation': 'By rotating crops between fields, the soil stays rich and fertile. Food production surges.',
      'preservation': 'Salt curing and smoking techniques reduce food waste. Your stores last longer through the seasons.',
      'hunting': 'Organized hunting parties can now track and harvest wild game reliably. The forest provides.',
      'construction': 'New building methods reduce material waste. Construction costs have decreased.',
      'masonry': 'Stone walls rise faster and stronger than ever. Your masons have truly mastered their craft.'
    };

    const message = messages[techId] || `Research into ${techName} has been completed, unlocking new possibilities for the settlement.`;
    this.addMessage(`tech_${techId}`, message);
  }

  exportState(): StoryMessage[] {
    return [...this.messages];
  }

  importState(messages: StoryMessage[]): void {
    this.messages = [...messages];
  }

  populationGrowth(newPopulation: number) {
    if (newPopulation === 2) {
      this.addMessage('pop_2', 'A traveling family has decided to join your settlement, drawn by the promise of a new life.');
    } else if (newPopulation === 5) {
      this.addMessage('pop_5', 'Word of your thriving community spreads. More settlers arrive, bringing skills and hope for the future.');
    } else if (newPopulation === 10) {
      this.addMessage('pop_10', 'Your settlement has grown into a proper village! The increased population brings new opportunities and challenges.');
    }
  }
}