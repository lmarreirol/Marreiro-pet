export const PROFESSIONALS = [
  { id: 'victor',    name: 'Victor Lopes',        unit: 'caucaia'    },
  { id: 'daniele',   name: 'Daniele Mendes',       unit: 'caucaia'    },
  { id: 'eduarda',   name: 'Eduarda',              unit: 'caucaia'    },
  { id: 'israel',    name: 'Israel',               unit: 'caucaia'    },
  { id: 'vitor',     name: 'Vitor Fernandes',      unit: 'caucaia'    },
  { id: 'vitoria',   name: 'Vitória Duraes',       unit: 'pecem'      },
  { id: 'christian', name: 'Christian Fernandes',  unit: 'pecem'      },
  { id: 'andresa',   name: 'Andresa Martins',      unit: 'taiba'      },
  { id: 'erica',     name: 'Erica Melo',           unit: 'taiba'      },
  { id: 'anderson',  name: 'Anderson Correia',     unit: 'saogoncalo' },
  { id: 'carla',     name: 'Carla Janaina',        unit: 'saogoncalo' },
]

export const PRO_NAMES: Record<string, string> = Object.fromEntries(
  PROFESSIONALS.map(p => [p.id, p.name])
)

export const PROFESSIONALS_BY_UNIT: Record<string, string[]> = PROFESSIONALS.reduce<Record<string, string[]>>(
  (acc, p) => { (acc[p.unit] ??= []).push(p.id); return acc },
  {}
)
