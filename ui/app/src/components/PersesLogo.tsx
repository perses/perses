// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { SVGProps } from 'react';

interface PersesLogoProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export const PersesLogo = (props: PersesLogoProps) => {
  const { title = 'Perses Logo' } = props;
  return (
    <svg width="130" height="43" viewBox="0 0 367 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title id="perses-banner-title">{title}</title>
      <rect width="367" height="120" />
      <path
        d="M121.76 86V41.328H138.016C142.155 41.328 145.312 42.459 147.488 44.72C149.664 46.981 150.752 50.139 150.752 54.192C150.752 58.245 149.664 61.403 147.488 63.664C145.312 65.925 142.155 67.056 138.016 67.056H127.136V86H121.76ZM127.136 62.384H137.888C140.149 62.384 141.899 61.829 143.136 60.72C144.416 59.568 145.056 57.947 145.056 55.856V52.528C145.056 50.437 144.416 48.837 143.136 47.728C141.899 46.576 140.149 46 137.888 46H127.136V62.384ZM160.135 86V41.328H187.655V46H165.511V61.04H186.887V65.712H165.511V81.328H187.655V86H160.135ZM203.886 86H198.51V41.328H214.766C218.905 41.328 222.062 42.459 224.238 44.72C226.414 46.981 227.502 50.139 227.502 54.192C227.502 57.819 226.563 60.72 224.686 62.896C222.809 65.072 220.078 66.331 216.494 66.672L227.886 86H221.87L210.99 66.928H203.886V86ZM214.638 62.384C216.899 62.384 218.649 61.829 219.886 60.72C221.166 59.568 221.806 57.947 221.806 55.856V52.528C221.806 50.437 221.166 48.837 219.886 47.728C218.649 46.576 216.899 46 214.638 46H203.886V62.384H214.638ZM250.197 86.768C246.186 86.768 242.901 86.043 240.341 84.592C237.781 83.099 235.669 81.2 234.005 78.896L237.909 75.696C239.658 77.872 241.493 79.493 243.413 80.56C245.376 81.627 247.701 82.16 250.389 82.16C253.632 82.16 256.106 81.413 257.813 79.92C259.52 78.427 260.373 76.336 260.373 73.648C260.373 71.472 259.754 69.787 258.517 68.592C257.28 67.355 255.125 66.48 252.053 65.968L247.061 65.136C244.885 64.752 243.05 64.176 241.557 63.408C240.106 62.64 238.933 61.723 238.037 60.656C237.141 59.547 236.501 58.352 236.117 57.072C235.733 55.749 235.541 54.384 235.541 52.976C235.541 48.88 236.885 45.787 239.573 43.696C242.261 41.605 245.888 40.56 250.453 40.56C254.037 40.56 257.045 41.157 259.477 42.352C261.952 43.547 263.936 45.232 265.429 47.408L261.653 50.672C260.416 49.051 258.922 47.728 257.173 46.704C255.424 45.68 253.162 45.168 250.389 45.168C247.36 45.168 245.034 45.808 243.413 47.088C241.792 48.368 240.981 50.288 240.981 52.848C240.981 54.853 241.578 56.496 242.773 57.776C244.01 59.013 246.208 59.909 249.365 60.464L254.165 61.296C256.341 61.68 258.176 62.256 259.669 63.024C261.162 63.792 262.357 64.709 263.253 65.776C264.192 66.843 264.853 68.037 265.237 69.36C265.621 70.683 265.813 72.069 265.813 73.52C265.813 77.659 264.448 80.901 261.717 83.248C259.029 85.595 255.189 86.768 250.197 86.768ZM275.26 86V41.328H302.78V46H280.636V61.04H302.012V65.712H280.636V81.328H302.78V86H275.26ZM326.947 86.768C322.936 86.768 319.651 86.043 317.091 84.592C314.531 83.099 312.419 81.2 310.755 78.896L314.659 75.696C316.408 77.872 318.243 79.493 320.163 80.56C322.126 81.627 324.451 82.16 327.139 82.16C330.382 82.16 332.856 81.413 334.563 79.92C336.27 78.427 337.123 76.336 337.123 73.648C337.123 71.472 336.504 69.787 335.267 68.592C334.03 67.355 331.875 66.48 328.803 65.968L323.811 65.136C321.635 64.752 319.8 64.176 318.307 63.408C316.856 62.64 315.683 61.723 314.787 60.656C313.891 59.547 313.251 58.352 312.867 57.072C312.483 55.749 312.291 54.384 312.291 52.976C312.291 48.88 313.635 45.787 316.323 43.696C319.011 41.605 322.638 40.56 327.203 40.56C330.787 40.56 333.795 41.157 336.227 42.352C338.702 43.547 340.686 45.232 342.179 47.408L338.403 50.672C337.166 49.051 335.672 47.728 333.923 46.704C332.174 45.68 329.912 45.168 327.139 45.168C324.11 45.168 321.784 45.808 320.163 47.088C318.542 48.368 317.731 50.288 317.731 52.848C317.731 54.853 318.328 56.496 319.523 57.776C320.76 59.013 322.958 59.909 326.115 60.464L330.915 61.296C333.091 61.68 334.926 62.256 336.419 63.024C337.912 63.792 339.107 64.709 340.003 65.776C340.942 66.843 341.603 68.037 341.987 69.36C342.371 70.683 342.563 72.069 342.563 73.52C342.563 77.659 341.198 80.901 338.467 83.248C335.779 85.595 331.939 86.768 326.947 86.768Z"
        fill="white"
      />
      <path
        d="M66.625 24H24.375C20.8542 24 18 26.8542 18 30.375C18 33.8958 20.8542 36.75 24.375 36.75H66.625C70.1458 36.75 73 33.8958 73 30.375C73 26.8542 70.1458 24 66.625 24Z"
        fill="white"
      />
      <path
        d="M86.625 44.75H44.375C40.8542 44.75 38 47.6042 38 51.125C38 54.6458 40.8542 57.5 44.375 57.5H86.625C90.1458 57.5 93 54.6458 93 51.125C93 47.6042 90.1458 44.75 86.625 44.75Z"
        fill="white"
      />
      <path
        d="M66.625 65.5H24.375C20.8542 65.5 18 68.3542 18 71.875C18 75.3958 20.8542 78.25 24.375 78.25H66.625C70.1458 78.25 73 75.3958 73 71.875C73 68.3542 70.1458 65.5 66.625 65.5Z"
        fill="white"
      />
      <path
        d="M31.625 86.25H24.375C20.8542 86.25 18 89.1042 18 92.625C18 96.1458 20.8542 99 24.375 99H31.625C35.1458 99 38 96.1458 38 92.625C38 89.1042 35.1458 86.25 31.625 86.25Z"
        fill="white"
      />
    </svg>
  );
};
