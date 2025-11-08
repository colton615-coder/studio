import type { LucideIcon } from "lucide-react";
import { 
  LayoutDashboard, 
  CheckCircle, 
  BookHeart, 
  Wallet, 
  Bot, 
  Dumbbell, 
  ListTodo, 
  ShoppingCart, 
  Calendar 
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habit Tracker", icon: CheckCircle },
  { href: "/journal", label: "AI Journal", icon: BookHeart },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/ai-knox", label: "AI Knox", icon: Bot },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/shopping", label: "Shopping List", icon: ShoppingCart },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];
