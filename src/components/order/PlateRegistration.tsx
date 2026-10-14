type PlateRegistrationProps = {
  lineOne: string;
  lineTwo: string;
};

export function PlateRegistration({ lineOne, lineTwo }: PlateRegistrationProps) {
  return (
    <div aria-hidden="true" className="plate-registration">
      <span className="plate-registration-line plate-registration-line-first">{lineOne}</span>
      <span className="plate-registration-line plate-registration-line-second">{lineTwo}</span>
    </div>
  );
}
