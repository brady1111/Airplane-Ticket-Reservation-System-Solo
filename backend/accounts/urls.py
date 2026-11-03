from django.urls import path
from .views import api_home, api_health, customer_count, register_customer, customer_login, check_login_status, customer_logout

urlpatterns = [
    path('', api_home, name='api-home'),
    path('health/', api_health, name='api-health'),
    path('customers/count/', customer_count, name='customer-count'),
    path('register/', register_customer, name='register-customer'),
    path('login/', customer_login, name='customer-login'),
    path('login-status/', check_login_status, name='login-status'),
    path('logout/', customer_logout, name='customer-logout'),
]