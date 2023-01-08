import { Service } from 'homebridge';
import BaseAccessory from '../BaseAccessory';

const SCHEMA_CODE = {
  ACTIVE: ['start'],
  CURRENT_TEMP: ['temp_current'],
  TARGET_TEMP: ['temp_set'],
  KEEP_WARM: ['warm'],
  WARM_TIME: ['warm_time'],
  WARM_COUNTDOWN: ['countdown_left'],
  STATE: ['status'],
  WORK_TYPE: ['work_type'],
};

export default class KettleAccessory extends BaseAccessory {
  requiredSchema(): string[][] {
    return [SCHEMA_CODE.ACTIVE, SCHEMA_CODE.CURRENT_TEMP, SCHEMA_CODE.TARGET_TEMP];
  }

  configureServices(): void {
    this.configureBaseStationDetection();
    this.configureSwitch();
  }

  mainService(): Service {
    return this.accessory.getService(this.Service.Switch)
      || this.accessory.addService(this.Service.Switch);
  }

  configureBaseStationDetection(): void {
    const { CONTACT_DETECTED, CONTACT_NOT_DETECTED } = this.Characteristic.ContactSensorState;
    const stateSchema = this.getSchema(...SCHEMA_CODE.STATE)!;

    this.mainService().getCharacteristic(this.Characteristic.ContactSensorState)
      .onGet(() => {
        const state = this.getStatus(stateSchema.code)!;

        return (state && state.value === '2') ? CONTACT_NOT_DETECTED : CONTACT_DETECTED;
      });
  }

  configureSwitch(): void {
    const activeSchema = this.getSchema(...SCHEMA_CODE.ACTIVE)!;
    const workTypeSchema = this.getSchema(...SCHEMA_CODE.WORK_TYPE)!;
    const targetTempSchema = this.getSchema(...SCHEMA_CODE.TARGET_TEMP)!;

    this.mainService().getCharacteristic(this.Characteristic.On)
      .onGet(() => {
        const active = this.getStatus(activeSchema.code)!;

        return (active && active.value === true) ? true : false;
      })
      .onSet(value => {
        if (value) {
          this.sendCommands([{
            code: activeSchema.code,
            value: true,
          }, {
            code: targetTempSchema.code,
            value: 100,
          }, {
            code: workTypeSchema.code,
            value: '5',
          }]);
        } else {
          this.sendCommands([{
            code: activeSchema.code,
            value: false,
          }, {
            code: targetTempSchema.code,
            value: 100,
          }, {
            code: workTypeSchema.code,
            value: '0',
          } ]);
        }
      });
  }
}