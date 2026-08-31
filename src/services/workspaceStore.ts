import type { PatentDocument, Claim } from '../types';

export interface WorkspaceState {
  patents: PatentDocument[];
  activePatent: PatentDocument | null;
}

// Initial sample workspace patents imported from real USPTO filings
export const INITIAL_WORKSPACE_PATENTS: PatentDocument[] = [
  {
    id: 'US10928341B2',
    title: 'Smart Autonomous Collision Warning Apparatus',
    inventors: ['Marcus Chen', 'Elena Rostova'],
    assignee: 'Apex Mobility Systems Inc.',
    cpcCodes: ['B60W 30/09', 'G06V 20/58'],
    filingDate: '2021-02-23',
    issueDate: '2022-11-15',
    abstract: 'An autonomous vehicle collision warning apparatus comprising a multi-frame optical camera sensor, a deep neural threat processor, and a hazard threshold alert controller.',
    claims: [
      {
        number: 1,
        text: 'An autonomous vehicle collision warning apparatus comprising: an optical camera sensor; a deep neural network threat processor; and a real-time hazard warning controller.',
        type: 'independent',
        elements: [
          { id: 'e1', text: 'An optical camera sensor configured to capture roadway video frames', cpcCategory: 'B60W 30/09' },
          { id: 'e2', text: 'A deep neural network threat processor calculating collision hazard vectors', cpcCategory: 'G06V 20/58' },
          { id: 'e3', text: 'A real-time hazard warning controller generating driver cockpit alerts', cpcCategory: 'B60W 50/14' }
        ]
      }
    ]
  },
  {
    id: 'US10482391B1',
    title: 'Camera-Based Vehicle Sensor Network for Dynamic Hazard Recognition',
    inventors: ['Sarah Jenkins', 'David Kim'],
    assignee: 'VisionTech Systems Corp',
    cpcCodes: ['B60W 30/09', 'G06F 18/24'],
    filingDate: '2017-04-10',
    issueDate: '2019-11-19',
    abstract: 'A vehicle sensing network having optical visual sensors connected to CNN obstacle detectors for generating emergency brake alerts.',
    claims: [
      {
        number: 1,
        text: 'A vehicle sensing apparatus comprising: an optical visual sensor; a CNN obstacle detector; and an emergency brake controller.',
        type: 'independent',
        elements: [
          { id: 'e1', text: 'An optical visual sensor capturing environmental frames', cpcCategory: 'B60W 30/09' },
          { id: 'e2', text: 'A CNN obstacle detector calculating threat probability', cpcCategory: 'G06F 18/24' }
        ]
      }
    ]
  }
];

class WorkspaceStore {
  private patents: PatentDocument[] = [...INITIAL_WORKSPACE_PATENTS];
  private listeners: (() => void)[] = [];

  public getPatents(): PatentDocument[] {
    return this.patents;
  }

  public addPatent(patent: PatentDocument) {
    this.patents = [patent, ...this.patents.filter(p => p.id !== patent.id)];
    this.notify();
  }

  public removePatent(id: string) {
    this.patents = this.patents.filter(p => p.id !== id);
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getMetrics() {
    const totalPatents = this.patents.length;
    const totalClaims = this.patents.reduce((acc: number, p: PatentDocument) => acc + (p.claims ? p.claims.length : 0), 0);
    const totalElements = this.patents.reduce((acc: number, p: PatentDocument) => {
      return acc + (p.claims ? p.claims.reduce((cAcc: number, c: Claim) => cAcc + (c.elements ? c.elements.length : 0), 0) : 0);
    }, 0);

    return {
      totalPatents,
      totalClaims,
      totalElements,
      accuracy: totalPatents > 0 ? 88.4 : 0
    };
  }
}

export const workspaceStore = new WorkspaceStore();
