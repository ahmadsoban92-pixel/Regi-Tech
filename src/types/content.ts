export type NavItem = {
  label: string;
  href: string;
};

export type Product = {
  id: string;
  name: string;
  badge: string;
  description: string;
  price: string;
  image: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type JourneyStep = {
  number: string;
  title: string;
  description: string;
  points: string[];
  icon: string;
};
