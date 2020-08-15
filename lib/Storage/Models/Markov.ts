export interface MarkovChain {
  id: number;
  guild: string;
  channel: string;
  enabled: boolean;
}

export interface MarkovChainSentence {
  id?: string;
  text: string;
  timestamp: number;
  markov_chain_id?: string;
}
