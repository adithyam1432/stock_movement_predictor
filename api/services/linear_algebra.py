import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances

def create_vectors(df: pd.DataFrame) -> np.ndarray:
    """
    Transforms the DataFrame into a matrix of feature vectors for ML models.
    Vector format incorporates advanced technicals if available.
    """
    # Use advanced technical indicators if they exist (added by data_pipeline)
    available_features = ['Open', 'Close', 'Body_Size', 'Direction']
    
    for tech_feature in ['RSI', 'MACD_Hist', 'BB_Width']:
        if tech_feature in df.columns:
            available_features.append(tech_feature)
            
    features = df[available_features].values
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)
    return scaled_features

def compute_similarity_matrix(df: pd.DataFrame, metric='cosine'):
    """
    Groups data by Time and calculates the average vector for each timeframe.
    Then computes the similarity matrix between these timeframes.
    """
    # Calculate mean features per timeframe
    available_features = ['Open', 'Close', 'Body_Size', 'Direction']
    for tech_feature in ['RSI', 'MACD_Hist', 'BB_Width']:
        if tech_feature in df.columns:
            available_features.append(tech_feature)
            
    timeframe_means = df.groupby('Time')[available_features].mean()
    timeframes = timeframe_means.index.tolist()
    
    scaler = StandardScaler()
    scaled_means = scaler.fit_transform(timeframe_means.values)
    
    if metric == 'cosine':
        sim_matrix = cosine_similarity(scaled_means)
    else:
        # Euclidean distance converted to similarity measure
        dists = euclidean_distances(scaled_means)
        sim_matrix = 1 / (1 + dists)
        
    # Format as a list of dicts for the frontend heatmap
    heatmap_data = []
    for i, t1 in enumerate(timeframes):
        row = {'id': t1}
        for j, t2 in enumerate(timeframes):
            row[t2] = round(sim_matrix[i][j], 4)
        heatmap_data.append(row)
        
    return heatmap_data, timeframes

def apply_pca(df: pd.DataFrame, n_components=2):
    """
    Applies PCA to reduce the vectors down to 2D for visualization.
    Gracefully handles small datasets by returning dummy points if needed.
    """
    vectors = create_vectors(df)
    n_samples, n_features = vectors.shape
    
    actual_components = min(n_components, n_samples, n_features)
    
    if actual_components == 0:
        return [[0.0] * n_components for _ in range(n_samples)]
        
    pca = PCA(n_components=actual_components)
    principal_components = pca.fit_transform(vectors)
    
    # Pad with 0s if we had to reduce components
    padded_components = []
    for row in principal_components:
        padded_row = list(row)
        while len(padded_row) < n_components:
            padded_row.append(0.0)
        padded_components.append(padded_row)
        
    return padded_components

def compute_weekday_similarity_matrix(df: pd.DataFrame, metric='cosine'):
    """
    Computes a similarity matrix for each weekday separately.
    Returns a dictionary mapping weekday -> {heatmap_data, timeframes}
    """
    weekday_matrices = {}
    if 'Weekday' not in df.columns:
        return weekday_matrices
        
    for weekday in df['Weekday'].unique():
        weekday_df = df[df['Weekday'] == weekday]
        if len(weekday_df) == 0:
            continue
            
        available_features = ['Open', 'Close', 'Body_Size', 'Direction']
        for tech_feature in ['RSI', 'MACD_Hist', 'BB_Width']:
            if tech_feature in weekday_df.columns:
                available_features.append(tech_feature)
                
        timeframe_means = weekday_df.groupby('Time')[available_features].mean()
        timeframes = timeframe_means.index.tolist()
        
        if len(timeframes) < 2:
            continue
            
        scaler = StandardScaler()
        scaled_means = scaler.fit_transform(timeframe_means.values)
        
        if metric == 'cosine':
            sim_matrix = cosine_similarity(scaled_means)
        else:
            dists = euclidean_distances(scaled_means)
            sim_matrix = 1 / (1 + dists)
            
        heatmap_data = []
        for i, t1 in enumerate(timeframes):
            row = {'id': t1}
            for j, t2 in enumerate(timeframes):
                row[t2] = round(sim_matrix[i][j], 4)
            heatmap_data.append(row)
            
        weekday_matrices[weekday] = {
            "heatmap_data": heatmap_data,
            "timeframes": timeframes
        }
        
    return weekday_matrices
