import React from "react";
import { Button } from "./Button";

/**
 * PrimaryButton – wraps Button with the primary (default) variant.
 * Ensures consistent Amber accent styling per KEN Enterprise design rules.
 */
export const PrimaryButton = React.forwardRef((props, ref) => (
  <Button ref={ref} variant="default" {...props} />
));

PrimaryButton.displayName = "PrimaryButton";
