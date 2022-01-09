// Copyright 2022 Yoshiya Hinosawa. All rights reserved. MIT license.

const READY_STATE_CHANGE = "readystatechange";

let p: Promise<void>;
export function documentReady() {
  return p = p || new Promise<void>((resolve) => {
    const doc = document;
    const checkReady = () => {
      if (doc.readyState === "complete") {
        resolve();
        doc.removeEventListener(READY_STATE_CHANGE, checkReady);
      }
    };

    doc.addEventListener(READY_STATE_CHANGE, checkReady);

    checkReady();
  });
}

interface LogEventMessage {
  component: string;
  e: Event;
  module: string;
  color?: string;
}

/** Gets the bold colored style */
const boldColor = (color: string): string =>
  `color: ${color}; font-weight: bold;`;

const defaultEventColor = "#f012be";

export function logEvent({
  component,
  e,
  module,
  color,
}: LogEventMessage) {
  const event = e.type;

  console.groupCollapsed(
    `${module}> %c${event}%c on %c${component}`,
    boldColor(color || defaultEventColor),
    "",
    boldColor("#1a80cc"),
  );
  console.log(e);

  if (e.target) {
    console.log(e.target);
  }

  console.groupEnd();
}
