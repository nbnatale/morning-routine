import type { Exercise, Phase, WorkoutConfig } from '../../shared/types'

export const LIBRARY: Record<Phase, Exercise[]> = {
  warmup: [
    {
      id: 'arms', name: 'Arm circles', tag: 'Shoulders', phase: 'warmup', dur: 30,
      tempo: { kind: 'flow', phases: [{ l: 'Circle forward', d: 5 }, { l: 'Circle back', d: 5, ease: true }] },
      how: [
        'Stand tall, arms straight out to the sides at shoulder height.',
        'Draw slow circles about the size of a dinner plate — 15 forward, then reverse.',
        'Keep your shoulders down, away from your ears.',
      ],
      quiet: 'Warms the shoulders for push-ups.',
    },
    {
      id: 'swings', name: 'Leg swings', tag: 'Hips', phase: 'warmup', dur: 30,
      tempo: { kind: 'flow', phases: [{ l: 'Swing forward', d: 1 }, { l: 'Swing back', d: 1, ease: true }] },
      how: [
        'Hold a wall or doorframe for balance.',
        'Swing one leg forward and back like a relaxed pendulum, letting the hip open.',
        'Keep your torso upright and core lightly braced. Switch legs at the halfway point.',
      ],
      quiet: 'Loosens hips and hamstrings before squats and lunges.',
    },
    {
      id: 'hipc', name: 'Hip circles', tag: 'Hips', phase: 'warmup', dur: 30,
      tempo: { kind: 'flow', phases: [{ l: 'Circle one way', d: 6 }, { l: 'Circle the other', d: 6, ease: true }] },
      how: [
        'Hands on hips, feet shoulder-width apart.',
        'Draw big slow circles with your beltline, like working a hula hoop.',
        'Half the time one direction, half the other.',
      ],
      quiet: 'Opens the hips and lower back.',
    },
    {
      id: 'catcow', name: 'Cat-cow', tag: 'Spine', phase: 'warmup', dur: 30,
      tempo: { kind: 'hold', phases: [{ l: 'Inhale, drop & open', d: 3 }, { l: 'Exhale, round up', d: 3, ease: true }] },
      how: [
        'On hands and knees, wrists under shoulders, knees under hips.',
        'Inhale: drop your belly, lift your chest and tailbone (cow).',
        'Exhale: round your spine to the ceiling, tuck your chin and tail (cat).',
        'Move with your breath, slow and smooth.',
      ],
      quiet: 'Wakes up the spine — good if you sit a lot.',
    },
    {
      id: 'wsquat', name: 'Slow squats', tag: 'Legs', phase: 'warmup', dur: 35,
      tempo: { kind: 'reps', phases: [{ l: 'Lower slowly', d: 3 }, { l: 'Stand tall', d: 2, ease: true }] },
      how: [
        'Feet shoulder-width, toes turned slightly out.',
        'Sink down slowly over three counts, as deep as is comfortable.',
        'Stand back up over two counts. No load yet — this just greases the knees and hips.',
      ],
      quiet: 'Stay flat-footed and quiet; no bouncing at the bottom.',
    },
  ],

  circuit: [
    {
      id: 'squat', name: 'Squats', tag: 'Legs', phase: 'circuit', dur: 40,
      tempo: { kind: 'reps', phases: [{ l: 'Lower', d: 2 }, { l: 'Drive up', d: 1, ease: true }] },
      how: [
        'Stand feet shoulder-width, toes slightly out, core braced.',
        'Push your hips back and bend your knees, lowering until your thighs are about parallel to the floor.',
        'Keep your weight in your heels and chest up; let your knees track out over your toes.',
        'Drive through the whole foot to stand tall, squeezing your glutes at the top.',
      ],
      mistake: 'Knees caving inward or heels lifting — push the knees out and sit back into the heels.',
      quiet: 'Stay flat-footed; control the descent so there\'s no thud.',
    },
    {
      id: 'pushup', name: 'Push-ups', tag: 'Chest · arms', phase: 'circuit', dur: 30,
      tempo: { kind: 'reps', phases: [{ l: 'Lower', d: 2 }, { l: 'Press up', d: 1, ease: true }] },
      how: [
        'Hands slightly wider than your shoulders, body in one straight line from head to heels.',
        'Lower your chest toward the floor, elbows angled about 45° from your body — not flared straight out.',
        'Press back up, keeping your core and glutes tight so your hips don\'t sag.',
        'Scale it: drop to your knees, or put your hands on the bed for an incline.',
      ],
      mistake: 'Hips sagging or sticking up — brace your core and squeeze your glutes to hold the plank line.',
      quiet: 'Lower with control; no flopping to the floor.',
    },
    {
      id: 'lunge', name: 'Reverse lunges', tag: 'Legs', phase: 'circuit', dur: 40,
      tempo: { kind: 'alt', per: 'side', phases: [{ l: 'Step back & lower', d: 2 }, { l: 'Drive up', d: 1, ease: true }] },
      how: [
        'Stand tall, hands on your hips or by your sides.',
        'Step one foot straight back and lower until both knees bend to about 90°, front shin vertical.',
        'Push through your front heel to return to standing.',
        'Alternate legs each rep. Stepping back rather than forward is gentler on the knees and quieter.',
      ],
      mistake: 'Front knee drifting past the toes — keep the front shin vertical and the weight in that heel.',
      quiet: 'Place the back foot down softly rather than tapping it.',
    },
    {
      id: 'plank', name: 'Plank', tag: 'Core', phase: 'circuit', dur: 30,
      tempo: { kind: 'hold', phases: [{ l: 'Breathe in', d: 4 }, { l: 'Breathe out', d: 4, ease: true }] },
      how: [
        'Forearms on the floor, elbows directly under your shoulders, toes tucked under.',
        'Form one straight line from your head to your heels.',
        'Squeeze your glutes and brace your abs as if bracing to be poked.',
        'Breathe steadily — don\'t hold your breath.',
      ],
      mistake: 'Hips piking up or sagging down — hold a flat line from shoulders to heels.',
      quiet: 'Fully silent — a perfect third-floor move.',
    },
    {
      id: 'bridge', name: 'Glute bridges', tag: 'Glutes', phase: 'circuit', dur: 30,
      tempo: { kind: 'reps', phases: [{ l: 'Drive hips up', d: 1 }, { l: 'Squeeze', d: 1 }, { l: 'Lower slowly', d: 2, ease: true }] },
      how: [
        'Lie on your back, knees bent, feet flat and hip-width, arms by your sides.',
        'Press through your heels and lift your hips until knees, hips and shoulders form a straight line.',
        'Squeeze your glutes hard at the top and pause.',
        'Lower slowly with control — don\'t just drop.',
      ],
      mistake: 'Arching the lower back instead of using the glutes — keep ribs down and squeeze the glutes to lift.',
      quiet: 'Silent and floor-based.',
    },
    {
      id: 'taps', name: 'Shoulder taps', tag: 'Core · full body', phase: 'circuit', dur: 30,
      tempo: { kind: 'alt', per: 'tap', phases: [{ l: 'Tap shoulder', d: 1 }, { l: 'Other hand', d: 1, ease: true }] },
      how: [
        'Start in a high plank (hands under shoulders), feet a little wider than usual for stability.',
        'Without letting your hips rock side to side, lift one hand and tap the opposite shoulder.',
        'Return it and switch hands. Slow and steady beats fast.',
        'This is the quiet stand-in for mountain climbers — same core and shoulder work, no jumping.',
      ],
      mistake: 'Hips swaying with each tap — widen your feet and brace hard to keep them still.',
      quiet: 'No impact at all — the whole point of the swap.',
    },
    {
      id: 'wallsit', name: 'Wall sit', tag: 'Legs', phase: 'circuit', dur: 35,
      tempo: { kind: 'hold', phases: [{ l: 'Breathe in', d: 4 }, { l: 'Breathe out', d: 4, ease: true }] },
      how: [
        'Stand with your back flat against a wall.',
        'Slide down until your thighs are parallel to the floor and your knees are stacked over your ankles.',
        'Hold the position, weight in your heels, back flat on the wall.',
        'Breathe steadily through the burn.',
      ],
      mistake: 'Knees pushing past the toes — walk your feet out until the shins are vertical.',
      quiet: 'Completely silent.',
    },
    {
      id: 'deadbug', name: 'Dead bugs', tag: 'Core', phase: 'circuit', dur: 35,
      tempo: { kind: 'alt', per: 'side', phases: [{ l: 'Extend & lower', d: 2 }, { l: 'Return', d: 1, ease: true }] },
      how: [
        'Lie on your back, arms reaching straight up, knees bent 90° stacked over your hips.',
        'Slowly lower your opposite arm and leg toward the floor while pressing your lower back flat into the ground.',
        'Return to the start and switch sides.',
        'Move slowly — control is the whole exercise.',
      ],
      mistake: 'Lower back arching off the floor — only reach as far as you can while keeping it pressed flat.',
      quiet: 'Floor-based and silent.',
    },
    {
      id: 'birddog', name: 'Bird dogs', tag: 'Core · back', phase: 'circuit', dur: 35,
      tempo: { kind: 'alt', per: 'side', phases: [{ l: 'Extend out', d: 2 }, { l: 'Hold', d: 1 }, { l: 'Return', d: 1, ease: true }] },
      how: [
        'On hands and knees, wrists under shoulders, knees under hips.',
        'Reach your opposite arm and leg straight out until they\'re level with your body.',
        'Pause, keeping your hips square to the floor and core braced, then return with control.',
        'Switch sides each rep.',
      ],
      mistake: 'Hips twisting toward the lifted leg — keep them level, as if balancing a glass on your back.',
      quiet: 'Silent and controlled.',
    },
    {
      id: 'calf', name: 'Calf raises', tag: 'Legs', phase: 'circuit', dur: 30,
      tempo: { kind: 'reps', phases: [{ l: 'Rise up', d: 1 }, { l: 'Pause', d: 1 }, { l: 'Lower slowly', d: 2, ease: true }] },
      how: [
        'Stand tall, feet hip-width — hold a wall for balance if you like.',
        'Rise up onto the balls of your feet as high as you can.',
        'Pause at the top, then lower your heels slowly back down.',
        'Barefoot is ideal here for ankle and foot strength.',
      ],
      mistake: 'Bouncing through the reps — pause at the top and control the way down.',
      quiet: 'Lower softly so your heels don\'t tap the floor.',
    },
    {
      id: 'dips', name: 'Tricep dips', tag: 'Arms', phase: 'circuit', dur: 30,
      tempo: { kind: 'reps', phases: [{ l: 'Lower', d: 2 }, { l: 'Press up', d: 1, ease: true }] },
      how: [
        'Sit on the edge of a sturdy bed or chair, hands gripping the edge beside your hips, fingers pointing forward.',
        'Slide your hips off the edge, legs out in front.',
        'Bend your elbows straight back to lower your hips, then press back up.',
        'Keep your elbows tracking backward, not flaring out to the sides.',
      ],
      mistake: 'Shrugging your shoulders up to your ears — keep them down and drive from the triceps.',
      quiet: 'Use a solid, non-creaky surface; move smoothly.',
    },
    {
      id: 'sideplank', name: 'Side plank', tag: 'Core', phase: 'circuit', dur: 30,
      tempo: { kind: 'hold', phases: [{ l: 'Breathe in', d: 4 }, { l: 'Breathe out', d: 4, ease: true }] },
      how: [
        'Lie on one side, forearm down with elbow under your shoulder.',
        'Stack your feet and lift your hips so your body is one straight line.',
        'Hold, breathing steadily; reach your top arm to the ceiling if you like.',
        'Switch sides at the halfway point.',
      ],
      mistake: 'Hips sinking toward the floor — lift them and hold the straight line.',
      quiet: 'Silent.',
    },
  ],

  cooldown: [
    {
      id: 'quad', name: 'Quad stretch', tag: 'Thighs', phase: 'cooldown', dur: 30,
      tempo: { kind: 'hold', phases: [{ l: 'Hold & breathe', d: 8 }] },
      how: [
        'Stand tall, holding a wall for balance.',
        'Pull one heel toward your glute, keeping your knees together and hips pushed slightly forward.',
        'Feel the stretch down the front of your thigh. Switch legs at the halfway point.',
      ],
      quiet: 'Don\'t yank — ease in and let it soften.',
    },
    {
      id: 'ham', name: 'Hamstring stretch', tag: 'Legs', phase: 'cooldown', dur: 35,
      tempo: { kind: 'hold', phases: [{ l: 'Hold & breathe', d: 8 }] },
      how: [
        'Hinge forward from your hips with soft (not locked) knees and let your upper body hang.',
        'Relax your neck and let your head be heavy.',
        'Breathe into the stretch and let gravity do the work.',
      ],
      quiet: 'Soft knees protect your lower back.',
    },
    {
      id: 'fig4', name: 'Figure-4 glute stretch', tag: 'Hips', phase: 'cooldown', dur: 35,
      tempo: { kind: 'hold', phases: [{ l: 'Hold & breathe', d: 8 }] },
      how: [
        'Lie on your back. Cross one ankle over the opposite thigh, just above the knee.',
        'Reach through and pull that thigh toward your chest.',
        'Feel the stretch deep in the glute and hip. Switch sides at the halfway point.',
      ],
      quiet: 'Great after squats and lunges.',
    },
    {
      id: 'chest', name: 'Chest opener', tag: 'Chest', phase: 'cooldown', dur: 30,
      tempo: { kind: 'hold', phases: [{ l: 'Hold & breathe', d: 8 }] },
      how: [
        'Clasp your hands behind your back and gently lift them, opening across your collarbones.',
        'Or rest a forearm on a doorframe and turn away from it.',
        'Lift through your chest and breathe.',
      ],
      quiet: 'Counteracts the push-ups and hunched desk posture.',
    },
    {
      id: 'child', name: 'Child\'s pose', tag: 'Back', phase: 'cooldown', dur: 35,
      tempo: { kind: 'hold', phases: [{ l: 'Breathe in', d: 5 }, { l: 'Breathe out', d: 5, ease: true }] },
      how: [
        'Kneel with big toes together and knees wide.',
        'Sit back onto your heels and walk your hands forward, lowering your forehead toward the floor.',
        'Let your chest melt down and breathe slowly into your back.',
      ],
      quiet: 'A calm finish to settle the breathing.',
    },
    {
      id: 'twist', name: 'Seated twist', tag: 'Spine', phase: 'cooldown', dur: 30,
      tempo: { kind: 'hold', phases: [{ l: 'Hold & breathe', d: 8 }] },
      how: [
        'Sit tall with one leg crossed over the other.',
        'Rotate gently toward the top leg, using your opposite elbow against the knee as a gentle lever.',
        'Keep your spine long. Switch sides at the halfway point.',
      ],
      quiet: 'Gentle — rotate only as far as is comfortable.',
    },
  ],
}

export interface Preset {
  id: string
  name: string
  rounds: number
  intensity: WorkoutConfig['intensity']
  on: { warmup: string[]; circuit: string[]; cooldown: string[] }
}

export const PRESETS: Preset[] = [
  {
    id: 'standard', name: 'Standard', rounds: 3, intensity: 'steady',
    on: { warmup: ['arms', 'swings', 'wsquat'], circuit: ['squat', 'pushup', 'lunge', 'plank', 'bridge', 'taps'], cooldown: ['quad', 'ham', 'chest', 'child'] },
  },
  {
    id: 'balanced', name: 'Balanced', rounds: 3, intensity: 'steady',
    on: { warmup: ['arms', 'swings', 'hipc'], circuit: ['squat', 'pushup', 'lunge', 'bridge', 'plank', 'birddog', 'taps'], cooldown: ['quad', 'ham', 'chest', 'child', 'twist'] },
  },
  {
    id: 'strength', name: 'Strength', rounds: 4, intensity: 'strong',
    on: { warmup: ['arms', 'swings', 'wsquat'], circuit: ['squat', 'pushup', 'lunge', 'dips', 'bridge', 'plank', 'wallsit'], cooldown: ['quad', 'ham', 'chest', 'child'] },
  },
  {
    id: 'legs', name: 'Legs & glutes', rounds: 4, intensity: 'steady',
    on: { warmup: ['swings', 'hipc', 'wsquat'], circuit: ['squat', 'lunge', 'bridge', 'wallsit', 'calf'], cooldown: ['quad', 'ham', 'fig4'] },
  },
  {
    id: 'core', name: 'Core', rounds: 3, intensity: 'steady',
    on: { warmup: ['catcow', 'hipc', 'wsquat'], circuit: ['plank', 'deadbug', 'birddog', 'taps', 'sideplank', 'bridge'], cooldown: ['child', 'twist', 'fig4'] },
  },
  {
    id: 'quick', name: 'Quick', rounds: 2, intensity: 'steady',
    on: { warmup: ['arms', 'wsquat'], circuit: ['squat', 'pushup', 'lunge', 'plank'], cooldown: ['ham', 'child'] },
  },
]

export const PACE: Record<WorkoutConfig['intensity'], number> = {
  easy: 0.78,
  steady: 1.0,
  strong: 1.25,
}

export function exerciseById(id: string): Exercise | undefined {
  for (const phase of Object.values(LIBRARY)) {
    const ex = phase.find((e) => e.id === id)
    if (ex) return ex
  }
  return undefined
}

// Replaces LIBRARY's contents in place (not the binding) so modules that
// already imported LIBRARY see the API-sourced data once it lands.
export function hydrateLibrary(next: Record<Phase, Exercise[]>): void {
  for (const phase of Object.keys(LIBRARY) as Phase[]) {
    LIBRARY[phase].length = 0
    LIBRARY[phase].push(...next[phase])
  }
}
