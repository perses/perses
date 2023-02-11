DiceFaces: 1 | 2 | 3 | 4 | 5 | 6 @cuetsy(kind="type")

Animal: {
    Name: string
    Sound: string
} @cuetsy(kind="interface")

LeggedAnimal: Animal & {
    Legs: int
} @cuetsy(kind="interface")

Pets: "Cat" | "Dog" | "Horse" @cuetsy(kind="enum")