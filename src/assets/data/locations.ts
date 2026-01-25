import type { District, Taluka, GramPanchayat, GatGramPanchayat } from '../../interfaces';

export const DISTRICTS: District[] = [
  { id: 'd1', name: 'Pune' },
  { id: 'd2', name: 'Mumbai' },
  { id: 'd3', name: 'Nagpur' },
  { id: 'd4', name: 'Nashik' },
  { id: 'd5', name: 'Aurangabad' }
];

export const TALUKAS: Taluka[] = [
  // Pune District
  { id: 't1', name: 'Pune City', parentId: 'd1' },
  { id: 't2', name: 'Haveli', parentId: 'd1' },
  { id: 't3', name: 'Mulshi', parentId: 'd1' },
  { id: 't4', name: 'Baramati', parentId: 'd1' },

  // Mumbai District
  { id: 't5', name: 'Mumbai City', parentId: 'd2' },
  { id: 't6', name: 'Andheri', parentId: 'd2' },
  { id: 't7', name: 'Kurla', parentId: 'd2' },

  // Nagpur District
  { id: 't8', name: 'Nagpur Urban', parentId: 'd3' },
  { id: 't9', name: 'Nagpur Rural', parentId: 'd3' },
  { id: 't10', name: 'Kamptee', parentId: 'd3' },

  // Nashik District
  { id: 't11', name: 'Nashik City', parentId: 'd4' },
  { id: 't12', name: 'Igatpuri', parentId: 'd4' },
  { id: 't13', name: 'Dindori', parentId: 'd4' },

  // Aurangabad District
  { id: 't14', name: 'Aurangabad City', parentId: 'd5' },
  { id: 't15', name: 'Paithan', parentId: 'd5' },
  { id: 't16', name: 'Gangapur', parentId: 'd5' }
];

export const GRAM_PANCHAYATS: GramPanchayat[] = [
  // Pune City Taluka
  { id: 'gp1', name: 'Kharadi', parentId: 't1' },
  { id: 'gp2', name: 'Hadapsar', parentId: 't1' },
  { id: 'gp3', name: 'Katraj', parentId: 't1' },

  // Haveli Taluka
  { id: 'gp4', name: 'Pirangut', parentId: 't2' },
  { id: 'gp5', name: 'Bavdhan', parentId: 't2' },
  { id: 'gp6', name: 'Sus', parentId: 't2' },

  // Mulshi Taluka
  { id: 'gp7', name: 'Paud', parentId: 't3' },
  { id: 'gp8', name: 'Lavale', parentId: 't3' },

  // Baramati Taluka
  { id: 'gp9', name: 'Morgaon', parentId: 't4' },
  { id: 'gp10', name: 'Supa', parentId: 't4' },

  // Mumbai City
  { id: 'gp11', name: 'Bandra East', parentId: 't5' },
  { id: 'gp12', name: 'Worli', parentId: 't5' },

  // Nagpur
  { id: 'gp13', name: 'Saoner', parentId: 't8' },
  { id: 'gp14', name: 'Katol', parentId: 't9' },

  // Nashik
  { id: 'gp15', name: 'Trimbak', parentId: 't11' },
  { id: 'gp16', name: 'Ghoti', parentId: 't12' },

  // Aurangabad
  { id: 'gp17', name: 'Ellora', parentId: 't14' },
  { id: 'gp18', name: 'Daulatabad', parentId: 't15' }
];

export const GAT_GRAM_PANCHAYATS: GatGramPanchayat[] = [
  // Kharadi GP
  { id: 'ggp1', name: 'Kharadi Zone 1', parentId: 'gp1' },
  { id: 'ggp2', name: 'Kharadi Zone 2', parentId: 'gp1' },

  // Hadapsar GP
  { id: 'ggp3', name: 'Hadapsar Zone A', parentId: 'gp2' },
  { id: 'ggp4', name: 'Hadapsar Zone B', parentId: 'gp2' },

  // Katraj GP
  { id: 'ggp5', name: 'Katraj North', parentId: 'gp3' },
  { id: 'ggp6', name: 'Katraj South', parentId: 'gp3' },

  // Pirangut GP
  { id: 'ggp7', name: 'Pirangut East', parentId: 'gp4' },
  { id: 'ggp8', name: 'Pirangut West', parentId: 'gp4' },

  // Other GPs
  { id: 'ggp9', name: 'Bavdhan Sector 1', parentId: 'gp5' },
  { id: 'ggp10', name: 'Sus Ward 1', parentId: 'gp6' },
  { id: 'ggp11', name: 'Paud Area 1', parentId: 'gp7' },
  { id: 'ggp12', name: 'Lavale Section A', parentId: 'gp8' }
];
