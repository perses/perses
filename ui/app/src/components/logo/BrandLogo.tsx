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

import { ReactElement, ImgHTMLAttributes } from 'react';
import { useBranding } from '../../model/branding-client';

interface BrandLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  title?: string;
}

function BrandLogo(props: BrandLogoProps): ReactElement {
  const { title = 'Logo', width = 'auto', height = '30', ...rest } = props;
  const { data: branding } = useBranding();
  return <img src={branding?.logo} alt={title} width={width} height={height} {...rest} />;
}

export default BrandLogo;
