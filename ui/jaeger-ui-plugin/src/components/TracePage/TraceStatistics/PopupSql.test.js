// Copyright (c) 2020 The Jaeger Authors.
//
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

import React from 'react';
import { shallow } from 'enzyme';
import PopupSql from './PopupSql';

describe('<PopupSQL', () => {
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      closePopup: () => {},
      popupContent:
        'select specialtie0_.vet_id as vet_id1_1_0_, specialtie0_.specialty_id as specialt2_1_0_, specialty1_.id as id1_0_1_, specialty1_.name as name2_0_1_ from vet_specialties specialtie0_ inner join specialties specialty1_ on specialtie0_.specialty_id=specialty1_.id where specialtie0_.vet_id=?',
    };
    wrapper = shallow(<PopupSql {...props} />);
  });

  it('does not explode', () => {
    expect(wrapper).toBeDefined();
  });

  it('renders PopupSQL', () => {
    expect(wrapper.find('.PopupSQL').length).toBe(1);
  });
});
