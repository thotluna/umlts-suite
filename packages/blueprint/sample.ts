export abstract class Hero {
  private name: string = 'name'

  getName(): string {
    const villain = new Villain()
    villain.getPower()
    return this.name
  }
}

class Villain {
  power: number = 10

  getPower(): number {
    return this.power
  }
}
