// Built-in public-domain melodies. Each note: [noteName, beats]. Rest: ["R", beats].
// Kept in a comfortable mid-range; playback transposes into speaker-safe octaves.

export const SONGS = [
  {
    id: "twinkle",
    title: "Twinkle Twinkle Little Star",
    origin: "Traditional (Public Domain)",
    tempo: 100, // BPM
    notes: [
      ["C4", 1], ["C4", 1], ["G4", 1], ["G4", 1], ["A4", 1], ["A4", 1], ["G4", 2],
      ["F4", 1], ["F4", 1], ["E4", 1], ["E4", 1], ["D4", 1], ["D4", 1], ["C4", 2],
      ["G4", 1], ["G4", 1], ["F4", 1], ["F4", 1], ["E4", 1], ["E4", 1], ["D4", 2],
      ["G4", 1], ["G4", 1], ["F4", 1], ["F4", 1], ["E4", 1], ["E4", 1], ["D4", 2],
      ["C4", 1], ["C4", 1], ["G4", 1], ["G4", 1], ["A4", 1], ["A4", 1], ["G4", 2],
      ["F4", 1], ["F4", 1], ["E4", 1], ["E4", 1], ["D4", 1], ["D4", 1], ["C4", 2],
    ],
  },
  {
    id: "mary",
    title: "Mary Had a Little Lamb",
    origin: "Traditional (Public Domain)",
    tempo: 110,
    notes: [
      ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["E4", 1], ["E4", 2],
      ["D4", 1], ["D4", 1], ["D4", 2], ["E4", 1], ["G4", 1], ["G4", 2],
      ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["E4", 1], ["E4", 1], ["E4", 1],
      ["D4", 1], ["D4", 1], ["E4", 1], ["D4", 1], ["C4", 2],
    ],
  },
  {
    id: "ode",
    title: "Ode to Joy",
    origin: "Beethoven (Public Domain)",
    tempo: 108,
    notes: [
      ["E4", 1], ["E4", 1], ["F4", 1], ["G4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1],
      ["C4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["E4", 1.5], ["D4", 0.5], ["D4", 2],
      ["E4", 1], ["E4", 1], ["F4", 1], ["G4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1],
      ["C4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["D4", 1.5], ["C4", 0.5], ["C4", 2],
    ],
  },
  {
    id: "row",
    title: "Row, Row, Row Your Boat",
    origin: "Traditional (Public Domain)",
    tempo: 96,
    notes: [
      ["C4", 1], ["C4", 1], ["C4", 0.75], ["D4", 0.25], ["E4", 1],
      ["E4", 0.75], ["D4", 0.25], ["E4", 0.75], ["F4", 0.25], ["G4", 2],
      ["C5", 0.5], ["C5", 0.5], ["C5", 0.5], ["G4", 0.5], ["G4", 0.5], ["G4", 0.5],
      ["E4", 0.5], ["E4", 0.5], ["E4", 0.5], ["C4", 0.5], ["C4", 0.5], ["C4", 0.5],
      ["G4", 0.75], ["F4", 0.25], ["E4", 0.75], ["D4", 0.25], ["C4", 2],
    ],
  },
  {
    id: "amazing",
    title: "Amazing Grace",
    origin: "Traditional (Public Domain)",
    tempo: 80,
    notes: [
      ["D4", 1], ["G4", 2], ["B4", 0.5], ["G4", 0.5], ["B4", 2], ["A4", 1],
      ["G4", 2], ["E4", 1], ["D4", 3],
      ["D4", 1], ["G4", 2], ["B4", 0.5], ["G4", 0.5], ["B4", 2], ["A4", 1],
      ["D5", 3],
    ],
  },
];
