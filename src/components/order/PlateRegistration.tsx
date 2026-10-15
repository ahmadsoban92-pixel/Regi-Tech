type PlateRegistrationProps = {
  lineOne: string;
  lineTwo: string;
  hasFlag?: boolean;
  hasLogo?: boolean;
  hasSlogan?: boolean;
};

export function PlateRegistration({ lineOne, lineTwo, hasFlag = false, hasLogo = false, hasSlogan = false }: PlateRegistrationProps) {
  const stateClasses = [hasFlag ? "plate-registration-has-flag" : "", hasLogo ? "plate-registration-has-logo" : "", hasSlogan ? "plate-registration-has-slogan" : ""].filter(Boolean).join(" ");
  return (
    <div aria-hidden="true" className={`plate-registration ${stateClasses}`}>
      <span className="plate-registration-line plate-registration-line-first">{lineOne}</span>
      <span className="plate-registration-line plate-registration-line-second">{lineTwo}</span>
    </div>
  );
}
