import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
import io
import re


class DataProcessor:
    def __init__(self):
        pass

    def process_file(self, file_contents: bytes, filename: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        try:
            if filename.endswith('.csv'):
                df = self._read_csv(file_contents)
                sheet_names = []
            elif filename.endswith(('.xlsx', '.xls')):
                df, sheet_names = self._read_excel(file_contents)
            else:
                raise ValueError(f"Unsupported file format: {filename}")

            df = self._clean_dataframe(df)

            metadata = self._analyze_data(df, sheet_names)

            return df, metadata

        except Exception as e:
            raise Exception(f"Error processing file: {str(e)}")

    def _read_csv(self, file_contents: bytes) -> pd.DataFrame:
        encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']

        for encoding in encodings:
            try:
                df = pd.read_csv(io.BytesIO(file_contents), encoding=encoding)
                return df
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue

        raise ValueError("Could not decode CSV file with any common encoding")

    def _read_excel(self, file_contents: bytes) -> Tuple[pd.DataFrame, List[str]]:
        try:
            excel_file = pd.ExcelFile(io.BytesIO(file_contents))
            sheet_names = excel_file.sheet_names

            if len(sheet_names) == 1:
                df = pd.read_excel(io.BytesIO(file_contents), sheet_name=0)
            else:
                dfs = []
                for sheet in sheet_names:
                    try:
                        sheet_df = pd.read_excel(io.BytesIO(file_contents), sheet_name=sheet)
                        if not sheet_df.empty:
                            sheet_df['_source_sheet'] = sheet
                            dfs.append(sheet_df)
                    except Exception:
                        continue

                if dfs:
                    df = pd.concat(dfs, ignore_index=True)
                else:
                    df = pd.read_excel(io.BytesIO(file_contents), sheet_name=0)

            return df, sheet_names

        except Exception as e:
            raise Exception(f"Error reading Excel file: {str(e)}")

    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df.columns = [self._clean_column_name(col) for col in df.columns]

        df = df.loc[:, ~df.columns.duplicated()]

        df = df.dropna(how='all')
        df = df.drop_duplicates()

        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].str.strip() if df[col].dtype == 'object' else df[col]

        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    df[col] = pd.to_numeric(df[col], errors='ignore')
                except:
                    pass

        return df

    def _clean_column_name(self, col: str) -> str:
        if pd.isna(col) or str(col).strip() == '':
            return 'unnamed_column'

        col_str = str(col).strip()

        col_str = re.sub(r'[^\w\s]', '_', col_str)
        col_str = re.sub(r'\s+', '_', col_str)
        col_str = col_str.lower()

        col_str = re.sub(r'_+', '_', col_str)
        col_str = col_str.strip('_')

        return col_str if col_str else 'unnamed_column'

    def _analyze_data(self, df: pd.DataFrame, sheet_names: List[str]) -> Dict[str, Any]:
        column_mapping = {}
        for col in df.columns:
            dtype = str(df[col].dtype)
            column_mapping[col] = dtype

        data_preview = df.head(10).to_dict(orient='records')

        for record in data_preview:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
                elif isinstance(value, (np.integer, np.floating)):
                    record[key] = float(value)

        data_quality_issues = self._detect_quality_issues(df)

        metadata = {
            "sheet_names": sheet_names,
            "column_mapping": column_mapping,
            "row_count": len(df),
            "data_preview": data_preview,
            "data_quality_issues": data_quality_issues,
        }

        return metadata

    def _detect_quality_issues(self, df: pd.DataFrame) -> List[str]:
        issues = []

        for col in df.columns:
            null_pct = (df[col].isna().sum() / len(df)) * 100
            if null_pct > 50:
                issues.append(f"Column '{col}' has {null_pct:.1f}% missing values")

        if df.duplicated().sum() > 0:
            issues.append(f"Found {df.duplicated().sum()} duplicate rows")

        unnamed_cols = [col for col in df.columns if 'unnamed' in col.lower()]
        if unnamed_cols:
            issues.append(f"Found {len(unnamed_cols)} unnamed columns")

        for col in df.columns:
            if df[col].dtype == 'object':
                unique_ratio = df[col].nunique() / len(df)
                if unique_ratio < 0.01 and len(df) > 100:
                    issues.append(f"Column '{col}' has very low variety ({unique_ratio*100:.1f}% unique values)")

        return issues