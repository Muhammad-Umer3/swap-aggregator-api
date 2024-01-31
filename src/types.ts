export interface CallDataType{
    target: string;
    data: string;
}

export interface SwapRequest{
    amount: number,
    message: string
}

export interface SwapResponseDTO{
    success: boolean;
    error?: string;
    transaction?: string;
}