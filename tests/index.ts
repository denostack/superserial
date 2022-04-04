import { serialize } from '../serialize';
import assert from 'assert';

function assertEquals(arg0: string, arg1: string) {
  return assert.equal(arg0, arg1);
}

assertEquals(serialize(null), 'null');
assertEquals(serialize(undefined), 'undefined');

assertEquals(serialize(true), 'true');
assertEquals(serialize(false), 'false');

assertEquals(serialize(30), '30');
assertEquals(serialize(30.1), '30.1');

assertEquals(serialize(30n), '30n');
assertEquals(serialize(-30n), '-30n');
assertEquals(serialize(9007199254740991000000n), '9007199254740991000000n');
assertEquals(serialize(-9007199254740991000000n), '-9007199254740991000000n');

assertEquals(serialize('string'), '"string"');
