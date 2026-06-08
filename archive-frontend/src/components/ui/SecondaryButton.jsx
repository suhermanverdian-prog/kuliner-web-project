// SecondaryButton component adhering to KEN Enterprise design rules
import React from "react";
import { Button } from "./Button";

/**
 * SecondaryButton – uses the outline variant of the base Button.
 * Provides consistent styling for secondary actions.
 */
export const SecondaryButton = React.forwardRef((props, ref) => (
  <Button ref={ref} variant="outline" {...props} />
));

SecondaryButton.displayName = "SecondaryButton";
