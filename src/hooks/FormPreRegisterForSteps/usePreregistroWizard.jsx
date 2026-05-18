import { useMemo, useState } from "react";
import {
  STEP_ORDER_WITH_ACCOUNT,
  STEP_ORDER_WITHOUT_ACCOUNT,
  WIZARD_STEPS,
} from "../../utils/preRegisterForSteps/stepsConfig";

export const usePreregistroWizard = ({ needsAccount = false }) => {
  const stepOrder = useMemo(
    () => (needsAccount ? STEP_ORDER_WITH_ACCOUNT : STEP_ORDER_WITHOUT_ACCOUNT),
    [needsAccount]
  );

  const [currentStepId, setCurrentStepId] = useState("bienvenida");

  const currentIndex = stepOrder.findIndex((id) => id === currentStepId);
  const currentStep = WIZARD_STEPS.find((step) => step.id === currentStepId) || WIZARD_STEPS[0];

  const canGoBack = currentIndex > 0;
  const isLastStep = currentIndex >= stepOrder.length - 1;

  const goNext = () => {
    if (isLastStep) return;
    setCurrentStepId(stepOrder[currentIndex + 1]);
  };

  const goBack = () => {
    if (!canGoBack) return;
    setCurrentStepId(stepOrder[currentIndex - 1]);
  };

  const goTo = (stepId) => {
    if (!stepOrder.includes(stepId)) return;
    setCurrentStepId(stepId);
  };

  const progress = Math.max(0, Math.round(((currentIndex + 1) / stepOrder.length) * 100));

  return {
    stepOrder,
    currentStep,
    currentStepId,
    currentIndex,
    progress,
    canGoBack,
    isLastStep,
    goNext,
    goBack,
    goTo,
    setCurrentStepId,
  };
};
