type RoadLegalMarkingsProps = {
  hasInnerBorder: boolean;
};

export function RoadLegalMarkings({ hasInnerBorder }: RoadLegalMarkingsProps) {
  return (
    <div
      aria-hidden
      className={`road-legal-markings ${hasInnerBorder ? "road-legal-markings-with-border" : ""}`}
    >
      <span className="road-legal-marking road-legal-marking-manufacturer">
        License Plate Workshop Ltd RG1 6LB
      </span>
      <span className="road-legal-marking road-legal-marking-standard">BS AU 145e</span>
    </div>
  );
}
