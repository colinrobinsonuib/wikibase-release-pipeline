FROM wikibase/wdqs-frontend:2@sha256:61400ba80550a092c519366e6a310badcb5b9ec06f00743c3e469dc74d3d3cdc
COPY wdqs-frontend-config.json /config/wdqs-frontend-config.json
COPY dnkb-query.js llms.txt /usr/share/nginx/html/
RUN sed -i 's@</body>@<script src="dnkb-query.js"></script></body>@' /usr/share/nginx/html/index.html \
    && sed -i 's@</head>@<link rel="describedby" href="/llms.txt" type="text/plain"></head>@' /usr/share/nginx/html/index.html