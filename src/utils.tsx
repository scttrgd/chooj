import { getHttpUriForMxc, Room, MatrixClient, MatrixEvent } from "matrix-js-sdk";
import { render } from "inferno";
import { RoomsViewState } from "./types";

const defaultAvatarSize = 36;

function urlBase64ToUint8Array(base64String: string) : Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function updateState(room: Room, state: RoomsViewState) : RoomsViewState {
  let isAlreadyOurRoom = false;
  // ^ is <room> a room we already have in this.state.rooms?
  state.rooms = state.rooms.map((ourRoom: Room) => {
    if (room.roomId === ourRoom.roomId) {
      isAlreadyOurRoom = true;
    }
    return ourRoom;
  });
  if (!isAlreadyOurRoom) {
    state.rooms.push(room);
  }
  return state;
}

function isDM(room: Room) : Boolean {
  return room.getJoinedMemberCount() === 2 && room.getMyMembership() === "join" && !room.isSpaceRoom();
}

function isRoom(room: Room) : Boolean {
  return room.getJoinedMemberCount() > 2 && room.getMyMembership() === "join" && !room.isSpaceRoom();
}

function getAvatarOrDefault(mxcUrl: string, defaultUrl: string, size?: number) : string {
  size = size || defaultAvatarSize;
  if (mxcUrl) {
    return getHttpUriForMxc(
      window.mClient.baseUrl,
      mxcUrl,
      size,
      size,
      "scale",
      true
    );
  } else {
    return defaultUrl;
  }
}

function startDM(client: MatrixClient, userId: string) {
  // TODO
}

function eventSender(sender: string, myself: string, dm?: Boolean) : string {
  if (myself === sender) {
    return "You";
  } else {
    if (dm) {
      return "They";
    } else {
      return sender;
    }
  }
}

function makeHumanReadableEvent(evt: MatrixEvent, dm?: Boolean) : string {
  if (!(evt instanceof Object)) {
    console.log("BOOO", evt);
  }
  const type: string = evt.getType();
  const content: object = evt.getContent();
  const sender: string = evt.getSender();
  const myself: Boolean = evt.getSender() === window.mClient.getUserId();

  switch (type) {
    case "m.call.hangup":
      return eventSender(sender, myself, dm) + " hanged the call up";
    case "m.call.reject":
      return eventSender(sender, myself, dm) + " rejected the call";
    case "m.room.member":
      return (
        eventSender(sender, myself, dm) +
        " " +
        content.membership +
        "ed the room"
      );
    case "m.room.message":
      return (
        eventSender(sender, myself, dm) +
        ": " +
        (["m.text", "m.notice"].includes(content.msgtype)
          ? content.body
          : content.msgtype)
      );
    default:
      return eventSender(sender, myself, dm) + " " + type;
  }
}

function bytesToHigherScale(b: number) : string {
  let units: Array<string> = ["B", "KiB", "MiB", "GiB"];
  let unit: number = 0;
  while (b >= 512 && unit < 3) {
    b /= 1024;
    unit++;
  }
  return `${b.toFixed(2)}${units[unit]}`;
}

function msToHigherScale(ms: number) : string {
  let units: Array<string> = ["s", "m", "h"];
  let unit: number = 0;
  ms /= 1000;
  while (ms >= 60) {
    ms /= 60;
    unit++;
  }
  return `${ms.toFixed(2)}${units[unit]}`;
}

function mxcMediaToHttp(hsUrl: string, mxcUrl: string) : string {
  let [serverName, mediaId] = mxcUrl.split("/").slice(2, 4);
  return `${hsUrl}/_matrix/media/v3/download/${serverName}/${mediaId}`;
}

function toast(message: string, timeout: number) {
  let container: HTMLElement = document.querySelector("#toast");
  container.style.display = "block";
  render(<p $HasTextChildren>{message}</p>, container);
  setTimeout(() => {
    container.style.display = "none";
  }, timeout);
}

function readableTimestamp(ts: number, includeSeconds?: Boolean) : string {
  let date = new Date(ts);
  let h = date.getHours().toString();
  let m = date.getMinutes().toString();
  if (h.length === 1) {
    h = "0" + h;
  }
  if (m.length === 1) {
    m = "0" + m;
  }
  let d = `${h}:${m}`;
  if (includeSeconds) {
    let s = date.getSeconds().toString();
    if (s.length === 1) {
      s = "0" + s;
    }
    d += ":" + s;
  }
  return "[" + d + "] ";
}

function getRoomLastEvent(room: Room) : MatrixEvent | null {
  let events = room.getLiveTimeline().getEvents();
  return events[events.length - 1] || null;
}

function getSomeDisplayName(userId: string) : string {
  let userObj = window.mClient.getUser(userId);
  if (userObj) {
    return userObj.displayName || userObj.userId.split(":")[0].replace("@", "");
  } else {
    return "-@UnknownUser@-";
  }
}

export {
  updateState,
  isRoom,
  isDM,
  getAvatarOrDefault,
  startDM,
  makeHumanReadableEvent,
  urlBase64ToUint8Array,
  bytesToHigherScale,
  msToHigherScale,
  mxcMediaToHttp,
  toast,
  readableTimestamp,
  getRoomLastEvent,
  getSomeDisplayName,
};
