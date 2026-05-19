# Stock Candle Pattern Analytics: Data Mining & Linear Algebra Study Guide

This document serves as an advanced, comprehensive study guide explaining the theoretical foundations, mathematical formulations, and practical implementation of **Linear Algebra** and **Data Mining** concepts used within the Candle Pattern analytics project.

---

## Table of Contents
1. [Mathematical Preprocessing Pipeline](#1-mathematical-preprocessing-pipeline)
2. [Advanced Feature Engineering Mathematics](#2-advanced-feature-engineering-mathematics)
3. [Linear Algebra: Feature Vector Spaces & Standardization](#3-linear-algebra-feature-vector-spaces--standardization)
4. [Linear Algebra: Dimensionality Reduction via PCA](#4-linear-algebra-dimensionality-reduction-via-pca)
5. [Linear Algebra: Heatmap & Similarity Calculations](#5-linear-algebra-heatmap--similarity-calculations)
6. [Data Mining: Unsupervised Clustering via K-Means](#6-data-mining-unsupervised-clustering-via-k-means)
7. [AI-Driven Analytical Inference (Insight Engine)](#7-ai-driven-analytical-inference-insight-engine)

---

## 1. Mathematical Preprocessing Pipeline
*File Reference: `api/services/cleaning_service.py` & `api/services/transformation_service.py`*

Before applying mathematical operations, the raw financial market data is passed through a deterministic pipeline that ensures data integrity and timezone alignment.

### A. Outlier & Null Imputation Rules
Real-world market data is often noisy, containing nulls due to ticker halts or data feed losses. The following heuristic corrections are applied to maintain the logical structure of a candlestick ($Low \le min(Open, Close) \le max(Open, Close) \le High$):

1. **Missing Open**: Imputed with the prior session's close price (relying on price continuity):
   $$\text{Open}_t \leftarrow \text{Close}_{t-1}$$
2. **Missing Close**: Imputed with the current session's open price (representing zero intraday movement):
   $$\text{Close}_t \leftarrow \text{Open}_t$$
3. **Missing High**: Imputed with the maximum of Open and Close:
   $$\text{High}_t \leftarrow \max(\text{Open}_t, \text{Close}_t)$$
4. **Missing Low**: Imputed with the minimum of Open and Close:
   $$\text{Low}_t \leftarrow \min(\text{Open}_t, \text{Close}_t)$$

### B. Logical Boundary Normalizations
If a high or low price violates physical trading bounds due to typing errors or anomalies, the pipeline corrects them:
* **High Breaches**: If $\text{High}_t < \max(\text{Open}_t, \text{Close}_t)$, we adjust:
  $$\text{High}_t = \max(\text{Open}_t, \text{Close}_t)$$
* **Low Breaches**: If $\text{Low}_t > \min(\text{Open}_t, \text{Close}_t)$, we adjust:
  $$\text{Low}_t = \min(\text{Open}_t, \text{Close}_t)$$

### C. Trading Hour & Temporal Normalization
* **Indian Sessions**: Filters timestamps to standard Indian trading hours ($09:15 \text{ IST} \le t \le 15:30 \text{ IST}$).
* **Trading Days**: Weekend data (Saturdays and Sundays) is detected and eliminated using:
  $$\text{Weekday}_t = f_{\text{day\_name}}(\text{Timestamp}_t)$$
  $$\text{Filter out: } \text{Weekday}_t \in \{\text{"Saturday"}, \text{"Sunday"}\}$$

---

## 2. Advanced Feature Engineering Mathematics
*File Reference: `api/services/feature_engineering_service.py`*

To move beyond raw price metrics, we engineer several derived physical and statistical candle attributes. Let $O_t$, $H_t$, $L_t$, and $C_t$ be the Open, High, Low, and Close prices for candle $t$.

### A. Body Size ($Body\_Size_t$)
Represents the absolute magnitude of the price range between the open and close:
$$Body\_Size_t = |C_t - O_t|$$

### B. Direction ($Direction_t$ and $Candle\_Type_t$)
Quantifies the binary momentum of the session:
$$Direction_t = \begin{cases} 1 & \text{if } C_t \ge O_t \\ -1 & \text{if } C_t < O_t \end{cases}$$

$$Candle\_Type_t = \begin{cases} \text{"Bullish"} & \text{if } C_t > O_t \\ \text{"Bearish"} & \text{if } C_t < O_t \\ \text{"Neutral"} & \text{if } C_t = O_t \end{cases}$$

### C. Upper Wick ($upper\_wick_t$) and Lower Wick ($lower\_wick_t$)
Measure the intra-period rejection of extreme high and low prices:
$$upper\_wick_t = H_t - \max(O_t, C_t)$$
$$lower\_wick_t = \min(O_t, C_t) - L_t$$

### D. Candle Strength ($candle\_strength_t$)
Calculates the proportion of the total trading range occupied by the candlestick body. This is an excellent indicator of market decisiveness:
$$candle\_strength_t = \frac{Body\_Size_t}{(H_t - L_t) + \epsilon}$$
where $\epsilon = 10^{-8}$ is a tiny regularization constant to prevent division-by-zero errors when a candle is completely flat ($H_t = L_t$).
* **$\text{Strength} \approx 1.0$**: Marubozu candles (pure body, no wicks, extreme conviction).
* **$\text{Strength} \approx 0.0$**: Doji candles (tiny body, wide wicks, extreme market indecision).

---

## 3. Linear Algebra: Feature Vector Spaces & Standardization
*File Reference: `api/services/linear_algebra.py`*

### A. The N-Dimensional Feature Space
Each candlestick is mapped to a vector $\mathbf{x}_i \in \mathbb{R}^4$ in a 4-dimensional real coordinate space:
$$\mathbf{x}_i = \begin{bmatrix} x_{i,1} \\ x_{i,2} \\ x_{i,3} \\ x_{i,4} \end{bmatrix} = \begin{bmatrix} \text{Open}_i \\ \text{Close}_i \\ \text{Body\_Size}_i \\ \text{Direction}_i \end{bmatrix}$$

### B. The Need for Standardization ($z$-score Normalization)
In linear algebra, calculations like Euclidean distances and projections are heavily dominated by the features with the largest absolute magnitudes. For instance, a stock price open value of $1500.0$ has a variation order of magnitude thousands of times larger than the binary direction feature ($\pm 1$). 

To ensure each dimension contributes equally, we standardize the data using the $z$-score. For a matrix of vectors $X \in \mathbb{R}^{M \times 4}$:

1. Calculate the mean ($\mu_j$) for each feature column $j$:
   $$\mu_j = \frac{1}{M} \sum_{i=1}^M x_{i,j}$$
2. Calculate the standard deviation ($\sigma_j$):
   $$\sigma_j = \sqrt{\frac{1}{M} \sum_{i=1}^M (x_{i,j} - \mu_j)^2}$$
3. Standardize every element:
   $$\hat{x}_{i,j} = \frac{x_{i,j} - \mu_j}{\sigma_j}$$

This standardizes the feature coordinates to have a mean of $0$ and a variance of $1$, resulting in the normalized matrix $\hat{X}$.

---

## 4. Linear Algebra: Dimensionality Reduction via PCA
*File Reference: `api/services/linear_algebra.py`*

### A. The Objective
We have 4-dimensional standardized candle vectors $\mathbf{\hat{x}}_i \in \mathbb{R}^4$. Visualizing 4D space directly is impossible for humans. We use **Principal Component Analysis (PCA)** to find a lower-dimensional linear subspace (specifically $\mathbb{R}^2$) that captures the maximum possible variance of the data.

```
       [ 4D Candle Vector ]  ---( PCA Projection )--->  [ 2D Scatter Point ]
  [Open, Close, Body_Size, Direction]                      [ PC1, PC2 Coordinates ]
```

### B. Covariance Matrix Computation
Let $\hat{X} \in \mathbb{R}^{M \times 4}$ be the standardized data matrix. Since $\hat{X}$ is centered (zero mean), the sample covariance matrix $\Sigma \in \mathbb{R}^{4 \times 4}$ is computed as:
$$\Sigma = \frac{1}{M-1} \hat{X}^T \hat{X}$$

$$\Sigma = \begin{bmatrix}
\text{Var}(X_1) & \text{Cov}(X_1, X_2) & \text{Cov}(X_1, X_3) & \text{Cov}(X_1, X_4) \\
\text{Cov}(X_2, X_1) & \text{Var}(X_2) & \text{Cov}(X_2, X_3) & \text{Cov}(X_2, X_4) \\
\text{Cov}(X_3, X_1) & \text{Cov}(X_3, X_2) & \text{Var}(X_3) & \text{Cov}(X_3, X_4) \\
\text{Cov}(X_4, X_1) & \text{Cov}(X_4, X_2) & \text{Cov}(X_4, X_3) & \text{Var}(X_4)
\end{bmatrix}$$

### C. Eigendecomposition of the Covariance Matrix
We find the directional vectors (eigenvectors $\mathbf{v}$) and their magnitude scales (eigenvalues $\lambda$) by solving the characteristic equation:
$$\Sigma \mathbf{v} = \lambda \mathbf{v}$$
$$\det(\Sigma - \lambda I) = 0$$

Solving this yields $4$ real-valued eigenvalues sorted in descending order:
$$\lambda_1 \ge \lambda_2 \ge \lambda_3 \ge \lambda_4 \ge 0$$

And their corresponding orthogonal eigenvectors:
$$\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3, \mathbf{v}_4 \in \mathbb{R}^4$$

* **$\lambda_1$ & $\mathbf{v}_1$**: First Principal Component ($PC_1$). This eigenvector represents the axis of absolute maximum variation in candle structures.
* **$\lambda_2$ & $\mathbf{v}_2$**: Second Principal Component ($PC_2$). Orthogonal to $PC_1$ ($\mathbf{v}_1 \cdot \mathbf{v}_2 = 0$), representing the axis of second-highest variation.

### D. Subspace Projection
We construct the projection matrix $W \in \mathbb{R}^{4 \times 2}$ using the top two eigenvectors:
$$W = \begin{bmatrix} \mathbf{v}_1 & \mathbf{v}_2 \end{bmatrix}$$

To project a 4D standardized candle vector $\mathbf{\hat{x}}_i$ down to 2D coordinates $\mathbf{z}_i = [z_{i,1}, z_{i,2}]^T$:
$$\mathbf{z}_i = W^T \mathbf{\hat{x}}_i$$

These projected coordinates $\mathbf{z}_i$ are plotted on the 2D interactive Scatter Plot, colored by their K-Means cluster labels, allowing immediate visual recognition of market-structure boundaries.

---

## 5. Linear Algebra: Heatmap & Similarity Calculations
*File Reference: `api/services/linear_algebra.py`*

To understand how similar various market hours are to one another, the system aggregates candles by their timeframe (e.g., "09:15" vs "15:15"), computes mean vectors, and runs pairwise similarity metrics.

Let $\mathbf{u}, \mathbf{v} \in \mathbb{R}^4$ represent the mean standardized candle vectors for two different trading times.

```
       Timeframe A (e.g. 09:15)                 Timeframe B (e.g. 15:15)
     [ Avg_O, Avg_C, Avg_B, Avg_D ]            [ Avg_O, Avg_C, Avg_B, Avg_D ]
                 \                                     /
                  \                                   /
                   +---> [ Similarity Measurement ] <+
                                  |
                                  v
                       [-1.0 to 1.0 Correlation]
```

### A. Cosine Similarity
Cosine similarity evaluates the cosine of the angle $\theta$ between the two vectors. It measures directional alignment rather than absolute magnitude:
$$\text{CosineSimilarity}(\mathbf{u}, \mathbf{v}) = \cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$

$$\text{CosineSimilarity}(\mathbf{u}, \mathbf{v}) = \frac{\sum_{k=1}^4 u_k v_k}{\sqrt{\sum_{k=1}^4 u_k^2} \sqrt{\sum_{k=1}^4 v_k^2}}$$

* **Range**: $[-1.0, 1.0]$
* **$1.0$**: Perfect positive correlation (identical average candle shape & direction).
* **$0.0$**: Orthogonal/independent relationships.
* **$-1.0$**: Perfect negative correlation (completely opposite candle directions).

### B. Euclidean Distance-Based Similarity
This metric measures the absolute geometric distance between timeframe behaviors.
First, we compute the standard $L_2$ Euclidean norm of the difference vector:
$$d(\mathbf{u}, \mathbf{v}) = \|\mathbf{u} - \mathbf{v}\|_2 = \sqrt{\sum_{k=1}^4 (u_k - v_k)^2}$$

To convert this unbounded distance ($[0, \infty)$) into a normalized similarity score bounded between $0.0$ and $1.0$, we apply the inverse conversion:
$$\text{EuclideanSimilarity}(\mathbf{u}, \mathbf{v}) = \frac{1}{1 + d(\mathbf{u}, \mathbf{v})}$$

* **Range**: $(0.0, 1.0]$
* **$\approx 1.0$**: The mean vectors are located at almost the exact same coordinate points in the 4D space.
* **$\approx 0.0$**: Extremely distant coordinates.

### C. Weekday Partitioning
The program computes these similarity matrices overall, and also partitions the data by weekday ($d \in \{\text{Monday}, \dots, \text{Friday}\}$):
$$S_d = \text{SimilarityMatrix}(\hat{X}_{\text{weekday}=d})$$
This helps traders detect if market opening hours on Mondays behave similarly to market closing hours on Fridays.

---

## 6. Data Mining: Unsupervised Clustering via K-Means
*File Reference: `api/services/data_mining.py`*

Clustering groups similar candlesticks into distinct behavioral clusters without using prior market labels.

```
  [Unlabeled Candle Vectors] ---> ( K-Means Clustering ) ---> [ 5 Distinct Market Patterns ]
                                                               - Strong Bullish Cluster
                                                               - Strong Bearish Cluster
                                                               - Neutral/Doji (Reversals)
```

### A. Mathematical Goal of K-Means
The algorithm partitions $M$ observations of standardized candle vectors $\mathbf{\hat{x}}_i$ into $k = 5$ clusters. It attempts to minimize the **Within-Cluster Sum of Squares (WCSS)** (also known as inertia):
$$\arg\min_{\mathbf{S}} \sum_{j=1}^k \sum_{\mathbf{\hat{x}}_i \in S_j} \|\mathbf{\hat{x}}_i - \mathbf{\mu}_j\|^2$$
where $\mathbf{\mu}_j$ is the centroid (mean vector) of cluster $S_j$.

### B. Algorithm Steps
1. **Centroid Initialization**: $k=5$ points are selected as initial centroids using `k-means++`, which spaces out initial centers to speed up convergence.
2. **Assignment Step**: Each candle $i$ is assigned to the cluster with the nearest centroid using the squared Euclidean distance:
   $$S_j^{(t)} = \left\{ \mathbf{\hat{x}}_i : \|\mathbf{\hat{x}}_i - \mathbf{\mu}_j^{(t)}\|^2 \le \|\mathbf{\hat{x}}_i - \mathbf{\mu}_{j'}^{(t)}\|^2, \forall j' \right\}$$
3. **Update Step**: Re-calculate the centroids by taking the mean of all points assigned to that cluster:
   $$\mathbf{\mu}_j^{(t+1)} = \frac{1}{|S_j^{(t)}|} \sum_{\mathbf{\hat{x}}_i \in S_j^{(t)}} \mathbf{\hat{x}}_i$$
4. **Convergence Criterion**: Steps 2 and 3 repeat until cluster assignments no longer change:
   $$S_j^{(t+1)} = S_j^{(t)} \quad \forall j$$

### C. Automated Cluster Interpretation
After K-Means converges, we extract semantic meanings from each cluster by analyzing the proportion of Bullish and Bearish candles contained within them.
Let $S_j$ be the set of candles in cluster $j$:

* **Bullish Ratio**:
  $$\text{BullishRatio}_j = \frac{1}{|S_j|} \sum_{i \in S_j} \mathbb{I}(\text{Type}_i = \text{"Bullish"})$$
* **Bearish Ratio**:
  $$\text{BearishRatio}_j = \frac{1}{|S_j|} \sum_{i \in S_j} \mathbb{I}(\text{Type}_i = \text{"Bearish"})$$

We classify the clusters using these ratios:
$$\text{ClusterPattern}_j = \begin{cases}
\text{"Strong Bullish"} & \text{if } \text{BullishRatio}_j > 0.6 \\
\text{"Strong Bearish"} & \text{if } \text{BearishRatio}_j > 0.6 \\
\text{"Neutral / Doji"} & \text{otherwise}
\end{cases}$$

* **Neutral / Doji Clusters** represent candles where body size is highly condensed relative to high-low range, indicating key pivot zones or trend exhaustion.

---

## 7. AI-Driven Analytical Inference (Insight Engine)
*File Reference: `api/services/insight_engine.py`*

The insight engine compiles the numerical results of clustering and linear algebra calculations into actionable natural language intelligence.

### A. Dominant Trend Discovery
By sorting the timeframe statistics by their probability ratios:
$$\text{Sorted}_{\text{Bullish}} = \text{SortDescending}(\{ \text{TimeframeRatio}_{\text{Bullish}}(t) \})$$
The system highlights high-probability directional hours if the ratio exceeds a statistical significance threshold:
$$\text{If } \text{TimeframeRatio}_{\text{Bullish}}(t) > 0.55 \implies \text{Generate Bullish Bias Warning}$$

### B. Weekday-Specific Bias Detection
We apply a higher, more rigorous threshold ($65\%$) for individual weekday timeframes to account for smaller sample sizes:
$$\text{If } \text{WeekdayTimeframeRatio}_{\text{Bearish}}(d, t) > 0.65 \implies \text{Generate Specific Day Bias Alert}$$

### C. Support & Resistance Reversal Zones
The K-Means cluster labeled as `"Neutral / Doji"` is mathematically highlighted as a potential reversal zone since it represents regions where buyers and sellers reached equilibrium (indecision):
$$\text{DojiCluster} \implies \text{Flag as Potential Reversal Zone}$$

---
*Created as study material for the Candle Pattern Data Mining Platform.*
