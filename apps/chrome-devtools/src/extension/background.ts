import type {
  ApplicationInformationContentMessage
} from '@o3r/application';
import type {
  InjectContentMessage,
  OtterMessage,
  OtterMessageContent,
  otterMessageType
} from '@o3r/core';
import type {
  scriptToInject as ScriptToInject
} from '../services/connection.service';
import type {
  ACTIVE_STATE_NAME_KEY as ActivateStateNameKey,
  ExtensionMessage,
  State,
  STATES_KEY as StatesKey,
  WHITELISTED_HOSTS_KEY as WhitelistedHostsKey
} from './interface';

/** Type of a message exchanged with the Otter Chrome DevTools extension */
const postMessageType: typeof otterMessageType = 'otter';

const scriptToInject: typeof ScriptToInject = 'extension/wrap.js';

const ACTIVE_STATE_NAME_KEY: typeof ActivateStateNameKey = 'ACTIVE_STATE_NAME';
const STATES_KEY: typeof StatesKey = 'STATES';
const WHITELISTED_HOSTS_KEY: typeof WhitelistedHostsKey = 'WHITELISTED_HOSTS';

/**
 * determine if the message is an OtterDebugMessage
 * @param message
 */
const isOtterDebugMessage = (message: any): message is OtterMessage => {
  return message?.type === postMessageType;
};

/**
 * determine if the message is an ExtensionMessage
 * @param message
 */
const isExtensionMessage = (message: any): message is ExtensionMessage => {
  return typeof message?.tabId !== 'undefined';
};

/**
 * determine if the message content is an InjectContentMessage
 * @param content
 */
const isInjectionContentMessage = (content: any): content is InjectContentMessage => {
  return content?.dataType === 'inject';
};

/**
 * determinate if the message contains application information to share in the global panel
 * @param data
 */
const isApplicationInformationMessage = (data?: OtterMessageContent): data is ApplicationInformationContentMessage => data?.dataType === 'applicationInformation';

const activeStateAppliedOn = new Set<number>();

/**
 * List of host which can access to the Chrome Extension store
 * @param url
 */
const isWhitelistedHost = async (url?: string) => {
  if (!url) {
    return;
  }
  const whitelistHosts = (await chrome.storage.sync.get(WHITELISTED_HOSTS_KEY))[WHITELISTED_HOSTS_KEY] as string[] || ['localhost'];
  const { hostname } = new URL(url);
  return whitelistHosts.some((host) => (new RegExp(host)).test(hostname));
};

/**
 * Retrieve a state and send a message to the Otter application connected to the DevTool that they should apply this
 * state.
 * @param appName
 * @param tabId
 */
const applyActivateState = async (appName: string, tabId: number) => {
  const sendMessage = async (dataType: string, content: any) => {
    await chrome.scripting.executeScript({
      target: { tabId },
      args: [dataType, JSON.stringify(content), postMessageType],
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions, @typescript-eslint/no-shadow
      func: function (dataType, content, postMessageType) {
        window.postMessage({
          type: postMessageType,
          to: 'app',
          content: {
            ...JSON.parse(content),
            dataType
          }
        }, '*');
      }
    });
  };
  const statesKey = `${appName}_${STATES_KEY}`;
  const states = (await chrome.storage.sync.get(statesKey))[statesKey] as Record<string, State> | undefined;
  const activateStateNameKey = `${appName}_${ACTIVE_STATE_NAME_KEY}`;
  const activateStateName = (await chrome.storage.sync.get(activateStateNameKey))[activateStateNameKey] as string | undefined;
  const activeState = states?.[activateStateName || ''];
  if (activeState) {
    activeStateAppliedOn.add(tabId);
    Object.entries(activeState?.configurations || {}).forEach(([id, configValue]) => sendMessage('updateConfig', { id, configValue }));
    Object.entries(activeState?.localizations || {}).forEach(([lang, overrides]) => {
      Object.entries(overrides).forEach(([key, value]) => sendMessage('updateLocalization', {
        key, value, lang
      }));
    });
    if (Object.keys(activeState.stylingVariables || {}).length > 0) {
      void sendMessage('updateStylingVariables', {
        variables: activeState.stylingVariables
      });
    }
    void sendMessage('stateSelection', {
      stateName: activeState.name,
      stateColor: activeState.color,
      stateColorContrast: activeState.colorContrast
    });
  }
};

/** map of connection base on Tab ID */
const connections = new Map<number, chrome.runtime.Port[]>();

chrome.runtime.onConnect.addListener((port) => {
  let tabId: number | undefined;
  // assign the listener function to a variable so we can remove it later
  const devToolsListener = async (message: any) => {
    // reject all messages not coming from the devtools
    if (!isOtterDebugMessage(message) || !isExtensionMessage(message)) {
      return console.warn('Unknown message', message);
    }

    const content = message.content;
    tabId = message.tabId;
    // Inject script if the connection is requested by a devtools instance
    if (isInjectionContentMessage(content)) {
      const ports = connections.get(tabId);
      if (ports) {
        connections.set(tabId, ports.concat(port));
      } else {
        connections.set(tabId, [port]);
      }
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [content.scriptToInject]
      });

    // forward all other messages to the application
    } else {
      await chrome.scripting.executeScript({
        target: { tabId },
        args: [JSON.stringify(content), postMessageType],
        // eslint-disable-next-line prefer-arrow/prefer-arrow-functions, @typescript-eslint/no-shadow
        func: function (content, postMessageType) {
          window.postMessage({
            type: postMessageType,
            to: 'app',
            content: JSON.parse(content)
          }, '*');
        }
      });
    }
  };
  // add the listener
  port.onMessage.addListener(devToolsListener);

  port.onDisconnect.addListener(() => {
    port.onMessage.removeListener(devToolsListener);
    if (tabId) {
      const ports = connections.get(tabId);
      if (ports) {
        const newPorts = ports.filter((p) => p !== port);
        if (newPorts.length > 0) {
          connections.set(tabId, newPorts);
        } else {
          connections.delete(tabId);
        }
      }
    }
  });
});

// Listen for messages from the application
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (tabId && isOtterDebugMessage(request)) {
    if (connections.has(tabId)) {
      // Redirect the message to the correct devtool instance (if any)
      connections.get(tabId)!.forEach((port) => port.postMessage(request));
      return sendResponse(true);
    }
    if (
      isApplicationInformationMessage(request.content)
      && !activeStateAppliedOn.has(tabId)
      && (await isWhitelistedHost(sender.url))
    ) {
      void applyActivateState(request.content.appName, tabId);
      return sendResponse(true);
    }
  }
  sendResponse(false);
});

chrome.webNavigation.onCommitted.addListener(async (args) => {
  const { url, tabId } = args;
  if (await isWhitelistedHost(url)) {
    if (activeStateAppliedOn.has(tabId)) {
      activeStateAppliedOn.delete(tabId);
    }
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptToInject]
    });
  }
});
