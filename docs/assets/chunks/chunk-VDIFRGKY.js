import{b as f,k as o,m as v,o as s}from"./chunk-KECI53AB.js";var l=f(d=>{"use strict";o();s();var r=v();function E(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var y=typeof Object.is=="function"?Object.is:E,h=r.useState,m=r.useEffect,w=r.useLayoutEffect,j=r.useDebugValue;function x(e,t){var u=t(),c=h({inst:{value:u,getSnapshot:t}}),n=c[0].inst,a=c[1];return w(function(){n.value=u,n.getSnapshot=t,i(n)&&a({inst:n})},[e,u,t]),m(function(){return i(n)&&a({inst:n}),e(function(){i(n)&&a({inst:n})})},[e]),j(u),u}function i(e){var t=e.getSnapshot;e=e.value;try{var u=t();return!y(e,u)}catch{return!0}}function b(e,t){return t()}var g=typeof window=="undefined"||typeof window.document=="undefined"||typeof window.document.createElement=="undefined"?b:x;d.useSyncExternalStore=r.useSyncExternalStore!==void 0?r.useSyncExternalStore:g});var q=f((L,S)=>{"use strict";o();s();S.exports=l()});export{q as a};
/*! Bundled license information:

use-sync-external-store/cjs/use-sync-external-store-shim.production.js:
  (**
   * @license React
   * use-sync-external-store-shim.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
