'use strict';

const { slackTimeStampToDate } = require('../../opt/time');

const chai = require('chai');
const { expect } = chai;


describe('time functions', () => {
  it('should transform a slack timestamp to a date', () => {
    let result = slackTimeStampToDate('1568169871.000200');
    let expected = '2019-09-10';
    expect(result).to.equal(expected);
  });

});
