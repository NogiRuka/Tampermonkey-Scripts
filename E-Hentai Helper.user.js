// ==UserScript==
// @name         E-Hentai Helper
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  画廊新窗口打开
// @author       乃木流架
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEh0lEQVR4nO1bzW/URhSfhUNLdt5mntMoioTUQ6V+8PFHcOAEpRcilJ3xpipVKB+RCB/imJW4cOWEEpReEC1pe+mZK3f+AEhvTUMrpT0hVRy2eo7XnrHHXpcdk8TMSE/a+MVjv5/f98wwlhlqZqbd5eIrCXhDcbzTCIJgWYI4tzg7O8FKRksC3lYc/1GAgyaS5Ph3F/AmyWpIvsLYIcXFD3v9gu+MOD42QJD05U2kXkoQqxLEvYbQKslkyAh4I7F5U+3FwyXGPmANGyST4mJdN4dF8gnkHLSLL5oovAkCbg7l7YI4yxTgrVQtxAPW8EHmYJiBBOxrF/pZ5xiCCIfhhH7Ttar8/Thy8soSABSIXtaDkpBV+QcegJC+bjaWglBV+QcegBXGDpFAWjhRWRMo4x94AJo4PADgNaBfYgLi6Z5XbjVTJGMRAOo9I+kBwKwGiGf7oHKrlUhGHwbB5wEDnwiBzwQHPhUGXwv0fTEkfTWIvhxWvh+AviGiSjpC0dIZTH6tOkIWdVqGHeJRnWMb6ffsLtPh5ZDjd7b2WtyGWyAqar8pEF9GPX9XHSFFwg//pyOWCh7aq9o5ttHwHuNZEHxT+i4WfreNFxI+D847AUDqFSPHnRBgauTEtntLa/PdbrLk+K127RcL0BulfG2Rl7TIPQAQLaHdfzsACsvtpJscwkefavP8mVnKbikQ2yV8AmgreV4bT9QCgAJ8I3lw7P8CULXrrED8bhOi18bjOe3R+PN86vMycFwCMFAcf60NAH2vQkdcS663xdXce+h8jpc1bft5lCxyLACihwen6wBAcrxkE4R+59/D4G/YgHENwBvt9/Oh7ToFAKY+s6gybeF5lXeeKV/3Dzb7dwMAp00G4nX6d3CxOgD2trttVTnrzCJKBf8rpoRPPmmU/TsBQAL2JeBdTQW35qan+bhhMLuqLEH8qKtzRFr4IzL4mn+whUenAMxNT3P9CxEgrvIAmx+wCpwBxPAPBfbvDAAWedzgoqYFr439N2PkAbaQZlP5rEmQ2o+yf6cArET1AT63OcdxnWA8WhLEHxan90pziqnQFezfKQA0uu3JU3Z1dgIAOcInFlP5KZ1bMwtLWKwdABqUENUGgJHYxHNwcSWZuyOWcgCU2H8tAPQ6nU8U4L91ABDy4Is8AGkK3m3jyRwAJfZfCwA0qDiqBkD1PCAeZnIDYjtbHOl+YJT91wZACDBFZbLLPMCa3oLYyL9b6gfK4v9YAITabrCiXWCmPYqe7d4yKprXbKik8yZ8PRzHWalzAFbS3WClu8BkB+fjl2yV7CSrlAdkwqGKNSSn3sMWGjnHOcYO1wJAk4YHALwG9L0JgPcBA+8EwUeBgQ+DgH1G5+i0bGyVNXwoEGtpZhksRwuJaaWFL5t8aGqBffyh5PibFgXOMDo6RkfI0nxarDcRhFj471M5cWeOHT0SMXUziJmb0emqxpwdFmv6l9/9+pPXdYBadJy0StXWCOL4yFZYtegcnWEOTSOOO/GXL26aLM7OTuw6xujI+Z7v7nazQzxYph0jic1r4z+3DJUNJNkEGAAAAABJRU5ErkJggg==
// @match        *://*.e-hentai.org/*
// @match        *://e-hentai.org/
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEh0lEQVR4nO1bzW/URhSfhUNLdt5mntMoioTUQ6V+8PFHcOAEpRcilJ3xpipVKB+RCB/imJW4cOWEEpReEC1pe+mZK3f+AEhvTUMrpT0hVRy2eo7XnrHHXpcdk8TMSE/a+MVjv5/f98wwlhlqZqbd5eIrCXhDcbzTCIJgWYI4tzg7O8FKRksC3lYc/1GAgyaS5Ph3F/AmyWpIvsLYIcXFD3v9gu+MOD42QJD05U2kXkoQqxLEvYbQKslkyAh4I7F5U+3FwyXGPmANGyST4mJdN4dF8gnkHLSLL5oovAkCbg7l7YI4yxTgrVQtxAPW8EHmYJiBBOxrF/pZ5xiCCIfhhH7Ttar8/Thy8soSABSIXtaDkpBV+QcegJC+bjaWglBV+QcegBXGDpFAWjhRWRMo4x94AJo4PADgNaBfYgLi6Z5XbjVTJGMRAOo9I+kBwKwGiGf7oHKrlUhGHwbB5wEDnwiBzwQHPhUGXwv0fTEkfTWIvhxWvh+AviGiSjpC0dIZTH6tOkIWdVqGHeJRnWMb6ffsLtPh5ZDjd7b2WtyGWyAqar8pEF9GPX9XHSFFwg//pyOWCh7aq9o5ttHwHuNZEHxT+i4WfreNFxI+D847AUDqFSPHnRBgauTEtntLa/PdbrLk+K127RcL0BulfG2Rl7TIPQAQLaHdfzsACsvtpJscwkefavP8mVnKbikQ2yV8AmgreV4bT9QCgAJ8I3lw7P8CULXrrED8bhOi18bjOe3R+PN86vMycFwCMFAcf60NAH2vQkdcS663xdXce+h8jpc1bft5lCxyLACihwen6wBAcrxkE4R+59/D4G/YgHENwBvt9/Oh7ToFAKY+s6gybeF5lXeeKV/3Dzb7dwMAp00G4nX6d3CxOgD2trttVTnrzCJKBf8rpoRPPmmU/TsBQAL2JeBdTQW35qan+bhhMLuqLEH8qKtzRFr4IzL4mn+whUenAMxNT3P9CxEgrvIAmx+wCpwBxPAPBfbvDAAWedzgoqYFr439N2PkAbaQZlP5rEmQ2o+yf6cArET1AT63OcdxnWA8WhLEHxan90pziqnQFezfKQA0uu3JU3Z1dgIAOcInFlP5KZ1bMwtLWKwdABqUENUGgJHYxHNwcSWZuyOWcgCU2H8tAPQ6nU8U4L91ABDy4Is8AGkK3m3jyRwAJfZfCwA0qDiqBkD1PCAeZnIDYjtbHOl+YJT91wZACDBFZbLLPMCa3oLYyL9b6gfK4v9YAITabrCiXWCmPYqe7d4yKprXbKik8yZ8PRzHWalzAFbS3WClu8BkB+fjl2yV7CSrlAdkwqGKNSSn3sMWGjnHOcYO1wJAk4YHALwG9L0JgPcBA+8EwUeBgQ+DgH1G5+i0bGyVNXwoEGtpZhksRwuJaaWFL5t8aGqBffyh5PibFgXOMDo6RkfI0nxarDcRhFj471M5cWeOHT0SMXUziJmb0emqxpwdFmv6l9/9+pPXdYBadJy0StXWCOL4yFZYtegcnWEOTSOOO/GXL26aLM7OTuw6xujI+Z7v7nazQzxYph0jic1r4z+3DJUNJNkEGAAAAABJRU5ErkJggg==";

  const green =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEj0lEQVR4nO1bS4/cRBDuLIeFsHZXeVlFI0XigMSbH8GBE68LUoQIEBEkCCQSuyHKcUfiwpUTCmhBAoUNVUMkctgL19zzA/K4EZIgLZwioRyMuj0el+1uj5Ox2azpkkryTM3Yrs/17rZSFTr0w6HHgeFNTbihGc8Og5N1IHhjdGl0UHkpVQc04ZmY8W/NmA6RY8K/NOFpo2tZ+U21pAl+2usb/A/5fAkETXim8oNrmuGcJvhyEGx0sToJHQk3Zj4vzT5m+FbtqGU1NNpRyzHBlnSHkYkJJjgIZK4OUvmcdtSyJrye6xsxvKY04+eFWcDXauA0dYfCDTTjWFjAuPTrTbUUEbybpxNzbL5rLX8IqaavbgAACN6rRlCrZEv5vgcgyp5uWUGGo23l+x4AZUyc4WieTqxyVRdoku97AAZIAQAOFjD2uwDBb3vfufXMmY7eGJD+z3gcANBlF7i8551b/3w5pEEOdUAaCiEOlWAaSmEOvcA4NEM6dIMY2mEd5gEYBiK6aSJkl870sZjgHe+oZTohnjc5dnHpP5tqKSY8ETN+7ByvbaolYHjfsG/8BhN43c78u5oIadLHihUVOOW8qJgQz5scuzj/j7yW5uSDpntxyWPCI0Vzl7zVDQBc+s1udDFanXti9/d+AKbTZE34oQB7UgcAfp4jny3yWivqAYBUE371QAB42m05TY62n3hanOdOaRXXLOEz3PLKMwBu5nL8BV/sC4B7K5Q8f98AtJw6xwy/u5RAxheqliPlK5PVZ5vA6Q4Atub1a18AlMyY4KQA5tPafUg54Yni/oBb6DJ+YACyiyev9AFATPiRSxFzXH8QhbwSH072AwDhPWEFV3Lf7RKAiFafqZlytoXntuNBFHIRH1z+3wkAMcFWzHBXpJrjrQHwjN1dq8rVYGZYnP/PKc/kJibN8/9uLIDt8RdCqZtrtLaycBqsrCprhm1pzobF54nhklzEB1d67BSANaOweEJTQDqpA5xxwKVwFRARH3z+3xkAyppoclwEorty/80idYAnpdVM3uESd+b5f6cAKFOzM15xBcdFg6ClLKj9UbMWwttF0CuUbuP/3QKglNIT/bLHpBcHIIsDF+rnBsrl0i3m5f9eADBkCqK+AJCFjfDvTwo5nHLIvf7fDwDb8VOa8Z8+AFjZTp6rKihLcCR8qSpv8v9eADBkmqNWANxHHeBufuBWvTkqxYFG/+8NgOhitGra5IXSoGd3mSxvzXFVXkmP3vy/EACR2A3m2wUm/dEMQVz/bQTAc145UJHnLQAq0nFelXYOgJruBpu3CyxmfNvepDTDyk6ytnXAjFJ1wF7bWIjLvPMRmgmOpB7pB4ABUQCAgwWMgwtwiAFpCIIcskAa0iCbOoDwtKi1z6mBU0zwTaFvsm4XEkVUvDbol6a+f/LRmPFG0X/gq8q8OmbfqCwaiq1BgpAp/5142LuH6fBjVlZ2Azt2uj59u+rsENiYvXzymY76M1Xpq8+36doGwYQ/1hur1K68bEh3GCDv2iffNDQZXRodzAJjsv4Q7Ozu6N3hZN3sGJn5vKB/AZtx5hHduSaLAAAAAElFTkSuQmCC";

  const name = "E-Hentai Helper";
  const logPrefix = [
    "%c" + name,
    `background:#f66158;border-radius: 0.5em;color: white;font-weight: bold;padding: 2px 0.5em`,
  ];
  function log(...args) {
    console.log(...logPrefix, ...args);
  }

  log("start");

  window.onload = function () {
    log("onload");

    document.querySelectorAll(".itg.gltc .glink").forEach((e) => {
      //   log(e.parentNode.href);
      //   log(e);
      //   const object = document.createElement("object");
      const text = `<object><a class='nogii' href="${e.parentNode.href}" target="_blank"><img class='nogi' width="16" height="16" style="margin-right: 5px;vertical-align: middle;" src="${icon}"></a></object>`;

      const t = e.innerHTML;

      e.innerHTML = text + t;

      let nogi = document.querySelectorAll(".nogi");

      nogi.forEach((nogi) => {
        nogi.addEventListener("mouseover", (e) => {
          e.target.src = green;
        });
        nogi.addEventListener("mouseout", (e) => {
          e.target.src = icon;
        });
      });
    });
  };

  // Your code here...
})();
