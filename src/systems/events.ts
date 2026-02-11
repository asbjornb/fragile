import { City, Season } from '../entities/city';

export interface StoryMessage {
  id: string;
  text: string;
  timestamp: number;
}

export interface GameEvent {
  type: 'bandit_raid' | 'harsh_winter' | 'civil_unrest' | 'season_change' | 'year_change' | 'starvation';
  effects: {
    integrityDamage?: number;
    populationLoss?: number;
    resourceDamage?: { resource: keyof City['resources']; amount: number }[];
    setHarshWinter?: boolean;
  };
  storyId: string;
  storyText: string;
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
      'hunters_lodge': 'Your scholars have studied the ways of the wild. Skilled hunters can now venture out to bring back game from the surrounding lands.',
      'stoneworks': 'Master masons have devised new techniques for cutting and shaping stone. A stoneworks will greatly increase your stone output.',
      'sawmill': 'With advanced tools, your carpenters can now build a proper sawmill. Timber production will surge.',
      'bakery': 'Rotating crops has yielded a surplus of grain. A bakery can turn it into bread to feed many more mouths.',
      'monument': 'Your masons propose erecting a grand monument. Its presence would inspire settlers and attract newcomers from far away.',
      'storehouse': 'Better construction methods allow for a large storehouse capable of holding all manner of supplies.',
      'watchtower': 'Your engineers can now build watchtowers. These elevated fortifications provide early warning and improved defense.',
      'guard_post': 'Guards can now be stationed around the settlement to defend against threats.'
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
      'masonry': 'Stone walls rise faster and stronger than ever. Your masons have truly mastered their craft.',
      'defenses': 'Military knowledge allows construction of fortified positions. The settlement can now defend itself.'
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
    } else if (newPopulation === 15) {
      this.addMessage('pop_15', 'Your village has grown into a small town. The challenges of managing so many souls weigh heavily.');
    } else if (newPopulation === 20) {
      this.addMessage('pop_20', 'Twenty souls now call this place home. A proper town council has formed to help govern.');
    }
  }
}

// Event generation system - checks conditions and returns events to apply
export class EventSystem {
  private lastBanditRaidTick: number = 0;
  private banditRaidCooldown: number = 30; // minimum ticks between raids

  checkForEvents(city: City, season: Season, isHarshWinter: boolean): GameEvent[] {
    const events: GameEvent[] = [];

    // Harsh winter check (10% chance per winter tick if not already harsh)
    if (season === 'winter' && !isHarshWinter) {
      // Only trigger at the start of winter (first tick)
      const winterStartTick = Math.floor(city.tickCount / 30) * 30;
      if (city.tickCount === winterStartTick && Math.random() < 0.25) {
        events.push({
          type: 'harsh_winter',
          effects: { setHarshWinter: true },
          storyId: 'event_harsh_winter',
          storyText: 'A brutal cold front sweeps across the land. This winter is far harsher than expected — food production will be severely reduced.'
        });
      }
    }

    // Bandit raid check (starts after tick 60, more frequent as city grows)
    if (city.tickCount > 60 && city.tickCount - this.lastBanditRaidTick >= this.banditRaidCooldown) {
      const raidChance = Math.min(0.08, 0.02 + city.population * 0.003);
      if (Math.random() < raidChance) {
        this.lastBanditRaidTick = city.tickCount;
        const defense = city.defenseRating;
        const raidStrength = Math.floor(5 + city.tickCount / 30);

        if (defense >= raidStrength) {
          // Defended successfully
          events.push({
            type: 'bandit_raid',
            effects: {},
            storyId: 'event_bandit_raid_defended',
            storyText: 'Bandits approached the settlement, but your guards drove them away. The defenses held firm.'
          });
        } else {
          // Raid damages the city
          const damage = Math.max(1, raidStrength - defense);
          const integrityLoss = Math.min(15, damage * 2);
          const foodLoss = Math.min(city.resources.food, Math.floor(damage * 1.5));
          const woodLoss = Math.min(city.resources.wood, damage);

          events.push({
            type: 'bandit_raid',
            effects: {
              integrityDamage: integrityLoss,
              resourceDamage: [
                { resource: 'food', amount: foodLoss },
                { resource: 'wood', amount: woodLoss }
              ]
            },
            storyId: 'event_bandit_raid',
            storyText: defense > 0
              ? `Bandits raided the settlement! Your guards fought bravely but were overwhelmed. They stole food and wood, and damaged buildings. (-${integrityLoss} integrity)`
              : `Bandits raided the undefended settlement! They pillaged food and building materials, leaving destruction in their wake. Build guard posts to defend! (-${integrityLoss} integrity)`
          });
        }
      }
    }

    // Civil unrest check (when unrest > 70)
    if (city.unrest > 70) {
      const unrestChance = (city.unrest - 70) / 100; // 0-30% chance based on unrest level
      if (Math.random() < unrestChance) {
        const severity = city.unrest > 90 ? 'severe' : 'moderate';
        if (severity === 'severe') {
          events.push({
            type: 'civil_unrest',
            effects: {
              integrityDamage: 10,
              populationLoss: 1
            },
            storyId: 'event_civil_unrest_severe',
            storyText: 'Riots have broken out! Desperate citizens clash in the streets. Some have fled, and buildings were damaged in the chaos. (-10 integrity, -1 population)'
          });
        } else {
          events.push({
            type: 'civil_unrest',
            effects: {
              integrityDamage: 5
            },
            storyId: 'event_civil_unrest',
            storyText: 'Discontent spreads through the settlement. Angry citizens damage property in protest. Address their grievances before it escalates! (-5 integrity)'
          });
        }
      }
    }

    return events;
  }

  exportState(): { lastBanditRaidTick: number } {
    return { lastBanditRaidTick: this.lastBanditRaidTick };
  }

  importState(data: { lastBanditRaidTick: number }): void {
    this.lastBanditRaidTick = data.lastBanditRaidTick;
  }
}
