import { Body, Controller, Post, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SwapRequest, SwapResponseDTO } from './types';
import { ethers } from 'ethers';
import SwapAggregatorAbi from './contract/SwappingAggregator.json';
import { ConfigService } from '@nestjs/config';
import AMMAbi from './contract/AMM.json';

@Controller('swaps')
export class AppController {
  constructor(private readonly appService: AppService, private readonly configService: ConfigService ) {}

  // I looked into schema validation for Nest which was quite a bit of work but ideally we should define vaidation
  // schemas and validate and handle them in a middlewere or something.

  @Get('history')
  async history(): Promise<any> {

    const rpcProvider = this.configService.get<string>('RPC_PROVIDER');
    const prviateKey = this.configService.get<string>('PRIVATE_KEY');
    const firstAMM = this.configService.get<string>('AMM_FIRST');

    const provider = new ethers.JsonRpcProvider(rpcProvider);
     const wallet = new ethers.Wallet(prviateKey, provider);

    let contract = new ethers.Contract(firstAMM, AMMAbi.abi, wallet);
    let filter = contract.filters.Swap;
    let events = await contract.queryFilter(filter);
    
    return events;
  }

  
  @Post('swap')
  async swap(@Body() requestBody: SwapRequest): Promise<SwapResponseDTO> {

    const rpcProvider = this.configService.get<string>('RPC_PROVIDER');
    const prviateKey = this.configService.get<string>('PRIVATE_KEY');
    const firstAMM = this.configService.get<string>('AMM_FIRST');
    const secondAMM = this.configService.get<string>('AMM_SECOND');
    const swapAggregator = this.configService.get<string>('SWAP_AGGREGATOR');

     const {amount, message} = requestBody;

     if(amount <= 1)
      return {
        success: false,
        error: 'Minimum 2 amount required'
      }


     const firstAmmAmount = amount / 2;
     const secondAmmAmount = amount - firstAmmAmount;

     const firstCallData = this.appService.getAmmCallData(firstAMM, firstAmmAmount, message);
     const secondCallData = this.appService.getAmmCallData(secondAMM, secondAmmAmount, message);

     const provider = new ethers.JsonRpcProvider(rpcProvider);
     const wallet = new ethers.Wallet(prviateKey, provider);

     let contract = new ethers.Contract(swapAggregator, SwapAggregatorAbi.abi, wallet);

     //TODO: Ethers v6 library has changed quite a bit and contract functions do not show up even providing the abi
     //This is a hack for now. Already Open Issue: https://github.com/ethers-io/ethers.js/issues/4183

     try{
        const tx = await (contract as any).execute([firstCallData,secondCallData]);
        await tx.wait();
        return {
          success: true,
          transaction: tx
        }
     }catch(e){
      return {
        success: false,
        error: e?.message ?? e
      }
     }

  }
}
