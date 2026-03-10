import pandas as pd
import numpy as np
import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

class ClaimsAnalytics:
    """Analyze healthcare claims dataset and generate insights"""
    
    def __init__(self, dataset_path: str = 'synthetic_healthcare_claims_dataset.csv') -> None:
        """Initialize with dataset
        
        Args:
            dataset_path: Path to the CSV dataset file
        """
        self.dataset_path = dataset_path
        self.df: Optional[pd.DataFrame] = None
        self.load_data()
    
    def load_data(self) -> None:
        """Load the dataset from CSV file"""
        try:
            self.df = pd.read_csv(self.dataset_path)
            logger.info(f"Loaded dataset: {len(self.df)} records, {len(self.df.columns)} columns")
        except FileNotFoundError as e:
            logger.error(f"Dataset not found at {self.dataset_path}", exc_info=True)
            raise
    
    def get_top_procedures_by_denial_rate(self, top_n: int = 10) -> List[Dict[str, Any]]:
        """Get top N procedures with highest denial rate
        
        Args:
            top_n: Number of top procedures to return
            
        Returns:
            List of procedure statistics dictionaries
        """
        procedure_stats = self.df.groupby('procedure_code').agg({
            'denial': ['sum', 'count', 'mean']
        }).round(4)
        
        procedure_stats.columns = ['denials', 'total_claims', 'denial_rate']
        procedure_stats = procedure_stats.sort_values('denial_rate', ascending=False)
        procedure_stats = procedure_stats.head(top_n)
        
        result: List[Dict[str, Any]] = []
        for idx, (procedure, row) in enumerate(procedure_stats.iterrows(), 1):
            result.append({
                'rank': idx,
                'procedure_code': procedure,
                'total_claims': int(row['total_claims']),
                'denied_claims': int(row['denials']),
                'denial_rate': float(row['denial_rate']),
                'denial_rate_percent': f"{row['denial_rate'] * 100:.1f}%"
            })
        
        return result
    
    def get_denial_rate_by_payer(self) -> List[Dict[str, Any]]:
        """Get denial rate for each payer"""
        payer_stats = self.df.groupby('payer').agg({
            'denial': ['sum', 'count', 'mean']
        }).round(4)
        
        payer_stats.columns = ['denials', 'total_claims', 'denial_rate']
        payer_stats = payer_stats.sort_values('denial_rate', ascending=False)
        payer_stats = payer_stats.reset_index()
        
        result = []
        for _, row in payer_stats.iterrows():
            result.append({
                'payer': row['payer'],
                'total_claims': int(row['total_claims']),
                'denied_claims': int(row['denials']),
                'approved_claims': int(row['total_claims'] - row['denials']),
                'denial_rate': float(row['denial_rate']),
                'denial_rate_percent': f"{row['denial_rate'] * 100:.1f}%",
                'approval_rate': float(1 - row['denial_rate']),
                'approval_rate_percent': f"{(1 - row['denial_rate']) * 100:.1f}%"
            })
        
        return result
    
    def get_denial_rate_by_provider_type(self) -> List[Dict[str, Any]]:
        """Get denial rate for each provider type
        
        Returns:
            List of provider type statistics dictionaries
        """
        provider_stats = self.df.groupby('provider_type').agg({
            'denial': ['sum', 'count', 'mean']
        }).round(4)
        
        provider_stats.columns = ['denials', 'total_claims', 'denial_rate']
        provider_stats = provider_stats.sort_values('denial_rate', ascending=False)
        provider_stats = provider_stats.reset_index()
        
        result: List[Dict[str, Any]] = []
        for _, row in provider_stats.iterrows():
            result.append({
                'provider_type': row['provider_type'],
                'total_claims': int(row['total_claims']),
                'denied_claims': int(row['denials']),
                'approved_claims': int(row['total_claims'] - row['denials']),
                'denial_rate': float(row['denial_rate']),
                'denial_rate_percent': f"{row['denial_rate'] * 100:.1f}%",
                'approval_rate': float(1 - row['denial_rate']),
                'approval_rate_percent': f"{(1 - row['denial_rate']) * 100:.1f}%"
            })
        
        return result
    
    def get_claim_amount_comparison(self):
        """Compare average claim amounts for denied vs approved claims"""
        denied_claims = self.df[self.df['denial'] == 1]['claim_amount']
        approved_claims = self.df[self.df['denial'] == 0]['claim_amount']
        
        result = {
            'denied_claims': {
                'count': int(len(denied_claims)),
                'avg_amount': float(denied_claims.mean()),
                'median_amount': float(denied_claims.median()),
                'min_amount': float(denied_claims.min()),
                'max_amount': float(denied_claims.max()),
                'std_dev': float(denied_claims.std()),
                'total_amount': float(denied_claims.sum())
            },
            'approved_claims': {
                'count': int(len(approved_claims)),
                'avg_amount': float(approved_claims.mean()),
                'median_amount': float(approved_claims.median()),
                'min_amount': float(approved_claims.min()),
                'max_amount': float(approved_claims.max()),
                'std_dev': float(approved_claims.std()),
                'total_amount': float(approved_claims.sum())
            },
            'comparison': {
                'avg_amount_difference': float(denied_claims.mean() - approved_claims.mean()),
                'avg_amount_difference_percent': f"{((denied_claims.mean() - approved_claims.mean()) / approved_claims.mean() * 100):.1f}%",
                'median_amount_difference': float(denied_claims.median() - approved_claims.median())
            }
        }
        
        return result
    
    def get_overall_statistics(self):
        """Get overall statistics"""
        total_claims = len(self.df)
        denied_claims = (self.df['denial'] == 1).sum()
        approved_claims = (self.df['denial'] == 0).sum()
        denial_rate = denied_claims / total_claims
        
        result = {
            'total_claims': int(total_claims),
            'denied_claims': int(denied_claims),
            'approved_claims': int(approved_claims),
            'denial_rate': float(denial_rate),
            'denial_rate_percent': f"{denial_rate * 100:.1f}%",
            'approval_rate': float(1 - denial_rate),
            'approval_rate_percent': f"{(1 - denial_rate) * 100:.1f}%",
            'avg_claim_amount': float(self.df['claim_amount'].mean()),
            'median_claim_amount': float(self.df['claim_amount'].median()),
            'total_claim_amount': float(self.df['claim_amount'].sum())
        }
        
        return result
    
    def get_denial_by_insurance_type(self):
        """Get denial rate by insurance type"""
        insurance_stats = self.df.groupby('insurance_type').agg({
            'denial': ['sum', 'count', 'mean']
        }).round(4)
        
        insurance_stats.columns = ['denials', 'total_claims', 'denial_rate']
        insurance_stats = insurance_stats.sort_values('denial_rate', ascending=False)
        insurance_stats = insurance_stats.reset_index()
        
        result = []
        for _, row in insurance_stats.iterrows():
            result.append({
                'insurance_type': row['insurance_type'],
                'total_claims': int(row['total_claims']),
                'denied_claims': int(row['denials']),
                'approved_claims': int(row['total_claims'] - row['denials']),
                'denial_rate': float(row['denial_rate']),
                'denial_rate_percent': f"{row['denial_rate'] * 100:.1f}%"
            })
        
        return result
    
    def get_prior_authorization_impact(self):
        """Get impact of prior authorization on denial rate"""
        auth_stats = self.df.groupby('prior_authorization').agg({
            'denial': ['sum', 'count', 'mean'],
            'claim_amount': ['mean', 'median']
        }).round(4)
        
        auth_stats.columns = ['denials', 'total_claims', 'denial_rate', 'avg_amount', 'median_amount']
        
        result = {
            'with_authorization': {
                'authorization_status': 'Yes',
                'total_claims': int(auth_stats.loc['yes', 'total_claims']),
                'denied_claims': int(auth_stats.loc['yes', 'denials']),
                'denial_rate': float(auth_stats.loc['yes', 'denial_rate']),
                'denial_rate_percent': f"{auth_stats.loc['yes', 'denial_rate'] * 100:.1f}%",
                'avg_claim_amount': float(auth_stats.loc['yes', 'avg_amount']),
                'median_claim_amount': float(auth_stats.loc['yes', 'median_amount'])
            },
            'without_authorization': {
                'authorization_status': 'No',
                'total_claims': int(auth_stats.loc['no', 'total_claims']),
                'denied_claims': int(auth_stats.loc['no', 'denials']),
                'denial_rate': float(auth_stats.loc['no', 'denial_rate']),
                'denial_rate_percent': f"{auth_stats.loc['no', 'denial_rate'] * 100:.1f}%",
                'avg_claim_amount': float(auth_stats.loc['no', 'avg_amount']),
                'median_claim_amount': float(auth_stats.loc['no', 'median_amount'])
            }
        }
        
        return result
    
    def get_documentation_impact(self):
        """Get impact of documentation completeness on denial rate"""
        doc_stats = self.df.groupby('documentation_complete').agg({
            'denial': ['sum', 'count', 'mean']
        }).round(4)
        
        doc_stats.columns = ['denials', 'total_claims', 'denial_rate']
        
        result = {
            'complete_documentation': {
                'documentation_status': 'Yes',
                'total_claims': int(doc_stats.loc['yes', 'total_claims']),
                'denied_claims': int(doc_stats.loc['yes', 'denials']),
                'denial_rate': float(doc_stats.loc['yes', 'denial_rate']),
                'denial_rate_percent': f"{doc_stats.loc['yes', 'denial_rate'] * 100:.1f}%"
            },
            'incomplete_documentation': {
                'documentation_status': 'No',
                'total_claims': int(doc_stats.loc['no', 'total_claims']),
                'denied_claims': int(doc_stats.loc['no', 'denials']),
                'denial_rate': float(doc_stats.loc['no', 'denial_rate']),
                'denial_rate_percent': f"{doc_stats.loc['no', 'denial_rate'] * 100:.1f}%"
            }
        }
        
        return result
    
    def generate_all_analytics(self):
        """Generate all analytics at once"""
        print("\n" + "="*60)
        print("Generating Claims Analytics...")
        print("="*60)
        
        analytics = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'dataset_file': self.dataset_path,
                'total_records': len(self.df)
            },
            'overall_statistics': self.get_overall_statistics(),
            'top_procedures_by_denial': self.get_top_procedures_by_denial_rate(),
            'denial_by_payer': self.get_denial_rate_by_payer(),
            'denial_by_provider_type': self.get_denial_rate_by_provider_type(),
            'denial_by_insurance_type': self.get_denial_by_insurance_type(),
            'claim_amount_comparison': self.get_claim_amount_comparison(),
            'prior_authorization_impact': self.get_prior_authorization_impact(),
            'documentation_impact': self.get_documentation_impact()
        }
        
        return analytics
    
    def save_analytics(self, output_file='claims_analytics.json', pretty_print=True):
        """Generate and save analytics to JSON file"""
        analytics = self.generate_all_analytics()
        
        with open(output_file, 'w') as f:
            if pretty_print:
                json.dump(analytics, f, indent=2)
            else:
                json.dump(analytics, f)
        
        print(f"\n✓ Analytics saved to: {output_file}")
        return analytics
    
    def display_summary(self):
        """Display summary of analytics"""
        overall = self.get_overall_statistics()
        denial_by_payer = self.get_denial_rate_by_payer()
        top_procedures = self.get_top_procedures_by_denial_rate(top_n=5)
        
        print("\n" + "="*60)
        print("CLAIMS ANALYTICS SUMMARY")
        print("="*60)
        
        print(f"\n📊 OVERALL STATISTICS")
        print(f"  Total Claims: {overall['total_claims']:,}")
        print(f"  Approved: {overall['approved_claims']:,}")
        print(f"  Denied: {overall['denied_claims']:,}")
        print(f"  Denial Rate: {overall['denial_rate_percent']}")
        print(f"  Average Claim Amount: \u20b9{overall['avg_claim_amount']:.2f}")
        
        print(f"\n🏥 DENIAL RATE BY PAYER")
        for payer in denial_by_payer:
            print(f"  {payer['payer']:15} - {payer['denial_rate_percent']} ({payer['denied_claims']:,}/{payer['total_claims']:,})")
        
        print(f"\n⚠️  TOP 5 PROCEDURES WITH HIGHEST DENIAL RATE")
        for proc in top_procedures:
            print(f"  {proc['procedure_code']:10} - {proc['denial_rate_percent']} ({proc['denied_claims']:,}/{proc['total_claims']:,})")
        
        print("\n" + "="*60)


def main():
    """Main execution function"""
    try:
        # Initialize analytics
        analytics = ClaimsAnalytics('synthetic_healthcare_claims_dataset.csv')
        
        # Display summary
        analytics.display_summary()
        
        # Save to JSON
        data = analytics.save_analytics('claims_analytics.json')
        
        print("\n✓ Analytics generation complete!")
        return data
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        raise


if __name__ == '__main__':
    main()
