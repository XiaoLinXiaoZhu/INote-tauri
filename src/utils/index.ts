import { enc, AES, mode, pad } from 'crypto-js';

type FunctionalControl = (this: any, fn: any, delay?: number) => (...args: any) => void;
type DebounceEvent = FunctionalControl;
type ThrottleEvent = FunctionalControl;

export const debounce: DebounceEvent = function(fn, delay = 1000) {
  let timer: number | null = null;
  return (...args: any) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

export const throttle: ThrottleEvent = function(fn, delay = 500) {
  let flag = true;
  return (...args: any) => {
    if (!flag) return;
    flag = false;
    setTimeout(() => {
      fn.apply(this, args);
      flag = true;
    }, delay);
  };
};

export const uuid = (): string => {
  const S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
};

export const symbolKey = 'crypto_key';
export const symbolIv = 'crypto_iv';
export const symbolEncrypt = 'crypto_encrypt';
export const symbolDecode = 'crypto_decode';
export const algorithm = {
  [symbolKey]: enc.Utf8.parse('1234123412ABCDEF'),
  [symbolIv]: enc.Utf8.parse('ABCDEF1234123412'),
  [symbolEncrypt]: (word: string) => {
    const srcs = enc.Utf8.parse(word);
    const encrypted = AES.encrypt(srcs, algorithm[symbolKey], {
      iv: algorithm[symbolIv],
      mode: mode.CBC,
      padding: pad.Pkcs7
    });
    return encrypted.ciphertext.toString().toUpperCase();
  },
  [symbolDecode]: (word: string) => {
    const encryptedHexStr = enc.Hex.parse(word);
    const srcs = enc.Base64.stringify(encryptedHexStr);
    const decrypt = AES.decrypt(srcs, algorithm[symbolKey], {
      iv: algorithm[symbolIv],
      mode: mode.CBC,
      padding: pad.Pkcs7
    });
    const decryptedStr = decrypt.toString(enc.Utf8);
    return decryptedStr.toString();
  }
};

export interface TwiceHandle {
  keydownInterval: ReturnType<typeof setInterval> | null;
  intervalCount: number;
  keydownCount: number;
  start: (fn: () => void) => void;
}

/**
 * 在300毫秒内触发2次事件的callback
 */
export const twiceHandle: TwiceHandle = {
  keydownInterval: null,
  intervalCount: 0,
  keydownCount: 0,
  start(fn) {
    if (!this.keydownInterval) {
      this.intervalCount += 1;
      this.keydownInterval = setInterval(() => {
        if (this.intervalCount > 5) {
          if (this.keydownInterval) {
            clearInterval(this.keydownInterval);
            this.keydownInterval = null;
          }
          this.intervalCount = 0;
          this.keydownCount = 0;
        } else {
          this.intervalCount += 1;
          if (this.keydownCount >= 2) {
            if (this.keydownInterval) {
              clearInterval(this.keydownInterval);
              this.keydownInterval = null;
            }
            this.intervalCount = 0;
            this.keydownCount = 0;
            fn();
          }
        }
      }, 50);
    }

    if (this.keydownCount <= 2) {
      this.keydownCount += 1;
    }
  }
};
