import { createTextVNode } from "inferno";
import classNames from "classnames";
import "./IRCLikeMessageItem.css";
import {
  mxcMediaToHttp,
  bytesToHigherScale,
  msToHigherScale,
  readableTimestamp,
  getSomeDisplayName,
} from "../../utils";


function getClassNameFromStatus(status) {
  if (status === null) return "";
  if (status === "not_sent") {
    return "not_sent";
  } else if (status === "sent") {
    return "";
  } else {
    return "sending";
  }
}

function IRCLikeMessageItemText({ date, text, sender, isFocused, status }) {
  return (
    <div className={classNames("ircmsg" + (isFocused ? "--focused" : ""), getClassNameFromStatus(status))} tabIndex={0}>
      <p>
        <b $HasTextChildren>{date}</b>
        <b $HasTextChildren>{`<${sender}>`}</b>
        {createTextVNode(" " + text)}
      </p>
    </div>
  );
}

function IRCLikeMessageItemNotice({ date, isFocused, text, sender, status }) {
  return (
    <div className={classNames("ircmsg" + (isFocused ? "--focused" : ""), getClassNameFromStatus(status))} tabIndex={0}>
      <p>
        <i>
          <b $HasTextChildren>{date}</b>
          <b $HasTextChildren>{`<${sender}>`}</b>
          {createTextVNode(" " + text)}
        </i>
      </p>
    </div>
  );
}

function IRCLikeMessageItemImage({
  date,
  sender,
  text,
  width,
  height,
  url,
  isFocused,
  status,
}) {
  while (height > (192 * 2) / 3) {
    height *= 0.75;
    width *= 0.75;
  }
  while (width > (238 * 2) / 3) {
    height *= 0.75;
    width *= 0.75;
  }
  url = window.mClient.mxcUrlToHttp(url, width, height, "scale", true);
  return (
    <div className={classNames("ircmsg" + (isFocused ? "--focused" : ""), getClassNameFromStatus(status))} tabIndex={0}>
      <p>
        <b $HasTextChildren>{date}</b>
        <b $HasTextChildren>{`<${sender}>`}</b>
        {createTextVNode(text)}
        <img width={width} height={height} src={url} alt={text} />
      </p>
    </div>
  );
}

function IRCLikeMessageItemAudio({
  date,
  isFocused,
  sender,
  size,
  duration,
  url,
  text,
  status,
}) {
  const hsUrl = window.mClient.getHomeserverUrl();
  url = mxcMediaToHttp(hsUrl, url);
  return (
    <div className={classNames("ircmsg" + (isFocused ? "--focused" : ""), getClassNameFromStatus(status))} tabIndex={0}>
      <p>
        <b $HasTextChildren>{date}</b>
        <b $HasTextChildren>{`${sender} has sent an audio clip.`}</b>
        <br />
        Title: {createTextVNode(text)}
        <br />
        Duration: {createTextVNode(msToHigherScale(duration))}
        <br />
        Size: {createTextVNode(bytesToHigherScale(size))}
        <audio src={url} autoplay={false} />
      </p>
    </div>
  );
}

function IRCLikeMessageItemUnknown({ date, isFocused, sender, status }) {
  return (
    <div className={classNames("ircmsg" + (isFocused ? "--focused" : ""), getClassNameFromStatus(status))} tabIndex={0}>
      <b $HasTextChildren>{date}</b>
      <p $HasTextChildren>Unsupported message type was sent from {sender}</p>
    </div>
  );
}

function IRCLikeMessageItem({ date, sender, content, isFocused, status }) {
  const userId = sender.userId;
  let displayName = getSomeDisplayName(userId);
  // In matrix-js-sdk 15.1.1 sometimes getUser(...) returns null. This is a temporary workaround.
  let d = readableTimestamp(date);
  switch (content.msgtype) {
    case "m.text":
      return (
        <IRCLikeMessageItemText
          date={d}
          sender={displayName}
          text={content.body}
          status={status}
          isFocused={isFocused}
        />
      );
    case "m.notice":
      return (
        <IRCLikeMessageItemNotice
          date={d}
          sender={displayName}
          text={content.body}
          status={status}
          isFocused={isFocused}
        />
      );
    case "m.image":
      return (
        <IRCLikeMessageItemImage
          date={d}
          sender={displayName}
          text={content.body}
          width={content.info.w}
          height={content.info.h}
          size={content.info.size}
          url={content.url}
          status={status}
          isFocused={isFocused}
        />
      );
    case "m.audio":
      return (
        <IRCLikeMessageItemAudio
          date={d}
          sender={displayName}
          text={content.body}
          duration={content.info.duration}
          size={content.info.size}
          url={content.url.content_uri}
          status={status}
          isFocused={isFocused}
        />
      );
    case "m.emote":
    case "m.video":
    case "m.location":
    case "m.file":
    default:
      return (
        <IRCLikeMessageItemUnknown
          date={d}
          sender={sender.userId}
          status={status}
          isFocused={isFocused}
        />
      );
  }
}

export default IRCLikeMessageItem;
