import { createElement } from "react";
import {
  UserRound,
  Smile,
  Cat,
  Dog,
  Rabbit,
  Bird,
  Fish,
  PawPrint,
  Rocket,
  Star,
  Heart,
  Crown,
  Ghost,
  Bug,
  Sun,
  Moon,
  Zap,
  Music,
  Sparkles,
  Apple,
  Flower2,
  Bed,
  Utensils,
  Trash2,
  BookOpen,
  Shirt,
  Car,
  Backpack,
  Pencil,
  Droplets,
  Leaf,
  AlarmClock,
  Brush,
  Bath,
  Dumbbell,
  Gift,
  Tv,
  IceCreamCone,
  Gamepad2,
  Candy,
  Ticket,
  Coins,
  Trophy,
  Bike,
  Popcorn,
  Film,
  PartyPopper,
  Pizza,
  Cookie,
  Tent,
  Medal,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

interface IconDef {
  label: string;
  Icon: LucideIcon;
}

/** Every key in `lib/icons` must have an entry here (verified by a unit test). */
const ICONS: Record<string, IconDef> = {
  // avatars
  person: { label: "Person", Icon: UserRound },
  smile: { label: "Smiley", Icon: Smile },
  cat: { label: "Cat", Icon: Cat },
  dog: { label: "Dog", Icon: Dog },
  rabbit: { label: "Rabbit", Icon: Rabbit },
  bird: { label: "Bird", Icon: Bird },
  fish: { label: "Fish", Icon: Fish },
  paw: { label: "Paw print", Icon: PawPrint },
  rocket: { label: "Rocket", Icon: Rocket },
  star: { label: "Star", Icon: Star },
  heart: { label: "Heart", Icon: Heart },
  crown: { label: "Crown", Icon: Crown },
  ghost: { label: "Ghost", Icon: Ghost },
  bug: { label: "Bug", Icon: Bug },
  sun: { label: "Sun", Icon: Sun },
  moon: { label: "Moon", Icon: Moon },
  zap: { label: "Lightning", Icon: Zap },
  music: { label: "Music", Icon: Music },
  sparkles: { label: "Sparkles", Icon: Sparkles },
  apple: { label: "Apple", Icon: Apple },
  flower: { label: "Flower", Icon: Flower2 },
  // chores
  bed: { label: "Make bed", Icon: Bed },
  dishes: { label: "Dishes", Icon: Utensils },
  trash: { label: "Take out trash", Icon: Trash2 },
  book: { label: "Reading", Icon: BookOpen },
  laundry: { label: "Laundry", Icon: Shirt },
  car: { label: "Car", Icon: Car },
  backpack: { label: "Pack bag", Icon: Backpack },
  homework: { label: "Homework", Icon: Pencil },
  plants: { label: "Water plants", Icon: Droplets },
  yard: { label: "Yard work", Icon: Leaf },
  alarm: { label: "Wake up", Icon: AlarmClock },
  clean: { label: "Clean", Icon: Brush },
  bath: { label: "Bath", Icon: Bath },
  exercise: { label: "Exercise", Icon: Dumbbell },
  pet: { label: "Feed pet", Icon: PawPrint },
  // rewards
  gift: { label: "Gift", Icon: Gift },
  tv: { label: "TV time", Icon: Tv },
  icecream: { label: "Ice cream", Icon: IceCreamCone },
  game: { label: "Game time", Icon: Gamepad2 },
  candy: { label: "Candy", Icon: Candy },
  ticket: { label: "Ticket", Icon: Ticket },
  coins: { label: "Allowance", Icon: Coins },
  trophy: { label: "Trophy", Icon: Trophy },
  bike: { label: "Bike ride", Icon: Bike },
  popcorn: { label: "Popcorn", Icon: Popcorn },
  movie: { label: "Movie", Icon: Film },
  party: { label: "Party", Icon: PartyPopper },
  pizza: { label: "Pizza", Icon: Pizza },
  cookie: { label: "Cookie", Icon: Cookie },
  tent: { label: "Camping", Icon: Tent },
  medal: { label: "Medal", Icon: Medal },
};

export function getIcon(key: string): LucideIcon {
  return ICONS[key]?.Icon ?? HelpCircle;
}

export function iconLabel(key: string): string {
  return ICONS[key]?.label ?? "Icon";
}

export interface IconOption {
  key: string;
  label: string;
  Icon: LucideIcon;
}

export function iconOptions(keys: readonly string[]): IconOption[] {
  return keys.map((key) => ({
    key,
    label: iconLabel(key),
    Icon: getIcon(key),
  }));
}

/** Render a stored icon key. Decorative by default (aria-hidden). */
export function IconByName({
  name,
  size = 24,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return createElement(getIcon(name), {
    size,
    className,
    "aria-hidden": true,
  });
}
