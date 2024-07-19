from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from scipy.spatial.distance import correlation
import random
import matplotlib.pyplot as plt
import seaborn as sns

movie_file = "movies.csv"
movie_data = pd.read_csv(movie_file, usecols=[0, 1])
movie_titles = movie_data['title'].tolist()

formatted_movies = []

for movie in movie_titles:
    if ', The' in movie:
        parts = movie.split(', The')
        title_part = parts[0].strip().replace(',', '')
        rest_part = parts[1].strip()
        formatted_movie = f'The {title_part} {rest_part}'
    else:
        formatted_movie = movie.replace(',', '')

    formatted_movies.append(formatted_movie)

formatted_movies_series = pd.Series(formatted_movies)

movie_data['title'] = formatted_movies_series

ratings_file = "ratings.csv"
ratings_info = pd.read_csv(ratings_file, usecols=[0, 1, 2])

movie_info = pd.merge(movie_data, ratings_info, left_on='movieId', right_on='movieId')
movie_info = movie_info.sort_values(['userId', 'movieId'], ascending=[0, 1])

user_movie_rating_matrix = pd.pivot_table(movie_info, values='rating', index=['userId'], columns=['movieId'])

app = Flask(__name__)

def get_top_movies(N=30):
    top_movies = movie_info.nlargest(N, 'rating')
    return list(top_movies.title)

def fav_movies(current_user, N=25):
    if current_user not in user_movie_rating_matrix.index:
        random_movies = random.sample(list(movie_data.title), 50)
        return random_movies

    user_fav_movies = pd.DataFrame.sort_values(movie_info[movie_info.userId == current_user], 
                                          ['rating'], ascending=[0])

    fav_movies = pd.DataFrame.sort_values(movie_info[movie_info.userId == current_user], 
                                          ['rating'], ascending=[0])[:N]
    return list(fav_movies.title)

def similarity(user1, user2):
    user1 = np.array(user1) - np.nanmean(user1)
    user2 = np.array(user2) - np.nanmean(user2)

    common_movie_ids = [i for i in range(len(user1)) if user1[i] > 0 and user2[i] > 0]

    if len(common_movie_ids) == 0:
        return 0
    else:
        user1 = np.array([user1[i] for i in common_movie_ids])
        user2 = np.array([user2[i] for i in common_movie_ids])
        return correlation(user1, user2)

def nearest_neighbour_ratings(current_user, K):
    similarity_matrix = pd.DataFrame(index=user_movie_rating_matrix.index, columns=['similarity'])

    for i in user_movie_rating_matrix.index:
        similarity_matrix.loc[i] = similarity(user_movie_rating_matrix.loc[current_user],
                                             user_movie_rating_matrix.loc[i])

    similarity_matrix = pd.DataFrame.sort_values(similarity_matrix, ['similarity'], ascending=[0])
    nearest_neighbours = similarity_matrix[:K]
    neighbour_movie_ratings = user_movie_rating_matrix.loc[nearest_neighbours.index]
    predicted_movie_rating = pd.DataFrame(index=user_movie_rating_matrix.columns, columns=['rating'])

    for i in user_movie_rating_matrix.columns:
        predicted_rating = np.nanmean(user_movie_rating_matrix.loc[current_user])

        for j in neighbour_movie_ratings.index:
            if user_movie_rating_matrix.loc[j, i] > 0:
                predicted_rating += ((user_movie_rating_matrix.loc[j, i] - np.nanmean(user_movie_rating_matrix.loc[j])) *
                                     nearest_neighbours.loc[j, 'similarity']) / nearest_neighbours['similarity'].sum()

        predicted_movie_rating.loc[i, 'rating'] = predicted_rating

    return predicted_movie_rating

def top_n_recommendations(current_user, N=25):
    if current_user not in user_movie_rating_matrix.index:
        top_movies = movie_info.sort_values(by=['rating'], ascending=False).head(50)
        return list(top_movies.title)

    predicted_movie_rating = nearest_neighbour_ratings(current_user, 10)
    movies_already_watched = list(user_movie_rating_matrix.loc[current_user]
                                  .loc[user_movie_rating_matrix.loc[current_user] > 0].index)

    predicted_movie_rating = predicted_movie_rating.drop(movies_already_watched)
    top_n_recommendations = pd.DataFrame.sort_values(predicted_movie_rating, ['rating'], ascending=[0])[:N]
    top_n_recommendation_titles = movie_data.loc[movie_data.movieId.isin(top_n_recommendations.index)]

    return list(top_n_recommendation_titles.title)

@app.route('/recommendations', methods=['POST'])
def recommendations():
    user_id = request.json['user_id']
    favorite_movies = fav_movies(user_id, 30)
    recommended_movies = top_n_recommendations(user_id, 30)
    all_movies = get_top_movies(30)

    user_similarity_matrix = pd.DataFrame(index=user_movie_rating_matrix.index, columns=user_movie_rating_matrix.index)

    for user1 in user_movie_rating_matrix.index:
        for user2 in user_movie_rating_matrix.index:
            user_similarity_matrix.loc[user1, user2] = similarity(user_movie_rating_matrix.loc[user1], user_movie_rating_matrix.loc[user2])

    nearest_neighbours = similarity_matrix[:10]
    predicted_ratings = nearest_neighbour_ratings(user_id, 10)

    plt.figure(figsize=(10, 8))
    sns.heatmap(user_similarity_matrix, cmap='coolwarm', annot=True, fmt=".2f", cbar_kws={'label': 'Similarity'})
    plt.title('User Similarity Matrix')
    plt.show()

    plt.figure(figsize=(10, 6))
    sns.barplot(x=nearest_neighbours['similarity'], y=nearest_neighbours.index, palette='viridis')
    plt.title('Top Nearest Neighbors')
    plt.xlabel('Similarity')
    plt.ylabel('User ID')
    plt.show()

    plt.figure(figsize=(12, 6))
    sns.barplot(x=predicted_ratings['rating'], y=predicted_ratings.index, palette='plasma')
    plt.title('Predicted Ratings for Movies')
    plt.xlabel('Predicted Rating')
    plt.ylabel('Movie ID')
    plt.show()

    response = {
        'favorite_movies': favorite_movies,
        'recommended_movies': recommended_movies,
        'all_movies': all_movies
    }

    return jsonify(response)

if __name__ == '__main__':
    app.debug = True
    app.run()
