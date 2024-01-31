import { Injectable } from '@nestjs/common';
import { CallDataType } from './types';
import { ethers } from 'ethers';

@Injectable()
export class AppService {

  getAmmCallData(ammType: string, amount: number, message: string): CallDataType {
    let abi = ["function swap(uint256,string)"];
    const iAMM = ethers.Interface.from(abi);
    return {
      target: ammType,
      data: iAMM.encodeFunctionData("swap", [amount, message]),
    };
  }

}
