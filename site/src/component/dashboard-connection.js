import { useRef, useEffect } from "react";
import { IS_DEV } from "./constants";

let UNIQUE_ID_COUNTER = 0;
const uniqueId = () => UNIQUE_ID_COUNTER++;

const noop = () => {};

export const useDashboardWsRefState = ({
  onMessage = noop,
  onOpen = noop,
  onClose = noop,
  onError = noop
}) => {
  const ws = useRef(null);
  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket(
        "ws://" +
          window.location.hostname +
          ":" +
          (IS_DEV ? 3001 : window.location.port) +
          "/ws-dashboard"
      );
    }
    ws.current.onmessage = message => onMessage(JSON.parse(message.data));
    ws.current.onopen = onOpen;
    ws.current.onclose = onClose;
    ws.current.onerror = onError;
  }, [onMessage, onOpen, onClose, onError]);
  return [
    ws.current,
    ws.current
      ? message => {
          const id = uniqueId();
          ws.current.send(JSON.stringify({ id, message }));
          return id;
        }
      : noop,
    ws
  ];
};
