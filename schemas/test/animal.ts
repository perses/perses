
type DiceFaces = (1 | 2 | 3 | 4 | 5 | 6);

interface Animal {
  Name: string;
  Sound: string;
}

interface LeggedAnimal extends Animal {
  Legs: number;
}

enum Pets {
  Cat = 'Cat',
  Dog = 'Dog',
  Horse = 'Horse',
}
