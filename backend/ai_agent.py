import pandas as pd
import numpy as np
from typing import Dict, Any, List
import os
import json


class AIAgent:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.use_openai = bool(self.openai_api_key)

        if self.use_openai:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.openai_api_key)
            except ImportError:
                self.use_openai = False

    def process_query(self, df: pd.DataFrame, query: str) -> Dict[str, Any]:
        query_lower = query.lower()

        data_summary = self._get_data_summary(df)

        if any(word in query_lower for word in ['trend', 'over time', 'timeline', 'change']):
            return self._analyze_trends(df, query, data_summary)
        elif any(word in query_lower for word in ['statistics', 'stats', 'summary', 'describe']):
            return self._generate_statistics(df, query, data_summary)
        elif any(word in query_lower for word in ['compare', 'comparison', 'vs', 'versus', 'difference']):
            return self._compare_data(df, query, data_summary)
        elif any(word in query_lower for word in ['top', 'bottom', 'highest', 'lowest', 'best', 'worst']):
            return self._find_extremes(df, query, data_summary)
        elif any(word in query_lower for word in ['average', 'mean', 'median', 'total', 'sum', 'count']):
            return self._calculate_aggregates(df, query, data_summary)
        elif any(word in query_lower for word in ['correlation', 'relationship', 'relate', 'connected']):
            return self._analyze_correlations(df, query, data_summary)
        else:
            return self._general_analysis(df, query, data_summary)

    def _get_data_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()

        return {
            "columns": list(df.columns),
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "row_count": len(df),
            "column_count": len(df.columns),
        }

    def _analyze_trends(self, df: pd.DataFrame, query: str, summary: Dict) -> Dict[str, Any]:
        numeric_cols = summary["numeric_columns"]

        if not numeric_cols:
            return {
                "answer": "I couldn't find any numeric columns to analyze trends. Your data appears to be primarily categorical.",
                "visualization": {},
                "metadata": {"query_type": "trend_analysis"},
            }

        trend_col = numeric_cols[0]

        if len(df) <= 20:
            chart_data = [
                {"label": f"Point {i+1}", "value": float(df[trend_col].iloc[i])}
                for i in range(len(df))
                if pd.notna(df[trend_col].iloc[i])
            ]
        else:
            bins = 10
            df_sorted = df.sort_values(by=trend_col)
            bin_size = len(df_sorted) // bins
            chart_data = []
            for i in range(bins):
                start_idx = i * bin_size
                end_idx = start_idx + bin_size if i < bins - 1 else len(df_sorted)
                avg_val = df_sorted[trend_col].iloc[start_idx:end_idx].mean()
                chart_data.append({"label": f"Segment {i+1}", "value": float(avg_val)})

        mean_val = df[trend_col].mean()
        std_val = df[trend_col].std()
        min_val = df[trend_col].min()
        max_val = df[trend_col].max()

        answer = f"""Based on the data analysis:

The column '{trend_col}' shows the following trend:
- Average value: {mean_val:.2f}
- Range: {min_val:.2f} to {max_val:.2f}
- Standard deviation: {std_val:.2f}

The data has been visualized to show the distribution pattern across the dataset."""

        return {
            "answer": answer,
            "visualization": {
                "type": "line",
                "data": chart_data,
            },
            "metadata": {"query_type": "trend_analysis", "column": trend_col},
        }

    def _generate_statistics(self, df: pd.DataFrame, query: str, summary: Dict) -> Dict[str, Any]:
        numeric_cols = summary["numeric_columns"]

        stats_list = []
        for col in numeric_cols[:5]:
            stats_list.append({
                "Column": col,
                "Mean": f"{df[col].mean():.2f}",
                "Median": f"{df[col].median():.2f}",
                "Std Dev": f"{df[col].std():.2f}",
                "Min": f"{df[col].min():.2f}",
                "Max": f"{df[col].max():.2f}",
            })

        answer = f"""Here's a statistical summary of your data:

Total rows: {len(df)}
Total columns: {len(df.columns)}
Numeric columns: {len(numeric_cols)}
Categorical columns: {len(summary['categorical_columns'])}

Key statistics are shown in the table below for the main numeric columns."""

        return {
            "answer": answer,
            "visualization": {
                "type": "table",
                "table": stats_list,
            },
            "metadata": {"query_type": "statistics"},
        }

    def _compare_data(self, df: pd.DataFrame, query: str, summary: Dict) -> Dict[str, Any]:
        categorical_cols = summary["categorical_columns"]
        numeric_cols = summary["numeric_columns"]

        if not categorical_cols or not numeric_cols:
            return {
                "answer": "I need both categorical and numeric columns to make comparisons. Please check your data structure.",
                "visualization": {},
                "metadata": {"query_type": "comparison"},
            }

        group_col = categorical_cols[0]
        value_col = numeric_cols[0]

        grouped = df.groupby(group_col)[value_col].mean().sort_values(ascending=False).head(10)

        chart_data = [
            {"label": str(idx), "value": float(val)}
            for idx, val in grouped.items()
        ]

        answer = f"""Comparison analysis of '{value_col}' across different '{group_col}':

The top performing categories are shown in the chart. The highest average value is {grouped.max():.2f} and the lowest among the top 10 is {grouped.min():.2f}."""

        return {
            "answer": answer,
            "visualization": {
                "type": "bar",
                "data": chart_data,
            },
            "metadata": {"query_type": "comparison", "group_by": group_col, "metric": value_col},
        }

    def _find_extremes(self, df: pd.DataFrame, query: str, summary: Dict) -> Dict[str, Any]:
        numeric_cols = summary["numeric_columns"]

        if not numeric_cols:
            return {
                "answer": "I couldn't find numeric columns to identify top or bottom values.",
                "visualization": {},
                "metadata": {"query_type": "extremes"},
            }

        target_col = numeric_cols[0]

        is_bottom = any(word in query.lower() for word in ['bottom', 'lowest', 'worst', 'minimum'])

        if is_bottom:
            top_data = df.nsmallest(10, target_col)
            direction = "lowest"
        else:
            top_data = df.nlargest(10, target_col)
            direction = "highest"

        if len(df.columns) > 1:
            label_col = df.columns[0] if df.columns[0] != target_col else df.columns[1]
        else:
            label_col = None

        if label_col:
            chart_data = [
                {"label": str(row[label_col]), "value": float(row[target_col])}
                for _, row in top_data.iterrows()
            ]
        else:
            chart_data = [
                {"label": f"Row {i+1}", "value": float(val)}
                for i, val in enumerate(top_data[target_col])
            ]

        answer = f"""Here are the {direction} values in '{target_col}':

Found {len(chart_data)} entries with values ranging from {top_data[target_col].min():.2f} to {top_data[target_col].max():.2f}."""

        return {
            "answer": answer,
            "visualization": {
                "type": "bar",
                "data": chart_data,
            },
            "metadata": {"query_type": "extremes", "column": target_col, "direction": direction},
        }

    def _calculate_aggregates(self, df: pd.DataFrame, query: str, summary: Dict) -> Dict[str, Any]:
        numeric_cols = summary["numeric_columns"]

        if not numeric_cols:
            return {
                "answer": "No numeric columns found for aggregate calculations.",
                "visualization": {},
                "metadata": {"query_type": "aggregates"},
            }

        results = []
        for col in numeric_cols:
            results.append({
                "Column": col,
                "Sum": f"{df[col].sum():.2f}",
                "Average": f"{df[col].mean():.2f}",
                "Median": f"{df[col].median():.2f}",
                "Count": str(df[col].count()),
            })

        answer = f"""Aggregate calculations for your numeric columns:

I've calculated sum, average, median, and count for each numeric column in your dataset."""

        return {
            "answer": answer,
            "visualization": {
                "type": "table",
                "table": results,
            },
            "metadata": {"query_type": "aggregates"},
        }

    def _analyze_correlations(self, df: pd.DataFrame, query: str, summary: Dict) -> Dict[str, Any]:
        numeric_cols = summary["numeric_columns"]

        if len(numeric_cols) < 2:
            return {
                "answer": "I need at least two numeric columns to analyze correlations.",
                "visualization": {},
                "metadata": {"query_type": "correlation"},
            }

        corr_matrix = df[numeric_cols].corr()

        correlations = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col1, col2 = numeric_cols[i], numeric_cols[j]
                corr_val = corr_matrix.loc[col1, col2]
                correlations.append({
                    "Column 1": col1,
                    "Column 2": col2,
                    "Correlation": f"{corr_val:.3f}",
                    "Strength": self._interpret_correlation(corr_val),
                })

        correlations.sort(key=lambda x: abs(float(x["Correlation"])), reverse=True)

        answer = f"""Correlation analysis between numeric columns:

Found {len(correlations)} column pairs. The correlations range from -1 (perfect negative) to +1 (perfect positive).

Strong correlations indicate that columns tend to change together."""

        return {
            "answer": answer,
            "visualization": {
                "type": "table",
                "table": correlations[:10],
            },
            "metadata": {"query_type": "correlation"},
        }

    def _interpret_correlation(self, corr: float) -> str:
        abs_corr = abs(corr)
        if abs_corr >= 0.7:
            return "Strong"
        elif abs_corr >= 0.4:
            return "Moderate"
        elif abs_corr >= 0.2:
            return "Weak"
        else:
            return "Very Weak"

    def _general_analysis(self, df: pd.DataFrame, query: str, summary: Dict) -> Dict[str, Any]:
        insights = []

        insights.append(f"Your dataset contains {len(df)} rows and {len(df.columns)} columns.")

        if summary["numeric_columns"]:
            insights.append(f"There are {len(summary['numeric_columns'])} numeric columns for quantitative analysis.")

        if summary["categorical_columns"]:
            insights.append(f"There are {len(summary['categorical_columns'])} categorical columns for grouping and segmentation.")

        numeric_cols = summary["numeric_columns"]
        if numeric_cols:
            chart_data = []
            for col in numeric_cols[:5]:
                chart_data.append({
                    "label": col,
                    "value": float(df[col].mean()),
                })

            answer = "\n".join(insights) + "\n\nThe chart shows average values for your main numeric columns."

            return {
                "answer": answer,
                "visualization": {
                    "type": "bar",
                    "data": chart_data,
                },
                "metadata": {"query_type": "general"},
            }
        else:
            answer = "\n".join(insights)
            return {
                "answer": answer,
                "visualization": {},
                "metadata": {"query_type": "general"},
            }