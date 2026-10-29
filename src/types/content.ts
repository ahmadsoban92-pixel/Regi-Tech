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
  gallery?: Array<{ src: string; alt: string }>;
};

export type FaqTextPart = {
  text: string;
  strong?: boolean;
};

export type FaqAnswerBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text?: string; parts?: FaqTextPart[] }
  | { type: "list"; items: Array<{ parts: FaqTextPart[] }> };

export type FaqItem = {
  question: string;
  answer: string | FaqAnswerBlock[];
};

export type JourneyStep = {
  number: string;
  title: string;
  description: string;
  points: string[];
  icon: string;
};
