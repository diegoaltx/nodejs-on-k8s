# nodejs-on-k8s

Exempo passo a passo de como criar uma imagem do Docker para uma aplicação em 
Node.js, publicá-la no GitHub Container Registry e, então, realizar o deploy 
para um cluster do Kubernetes.

## A aplicação de exemplo

A aplicação de exemplo é um projeto em Node.js, utilizando o 
[Express](https://expressjs.com/). A aplicação serve os arquivos estáticos 
disponíveis em `app/public` na porta `3000` (padrão) ou outra definida 
na variável de ambiente `APP_PORT`.

# Executando a aplicação de exemplo

Para executar a aplicação:

```
$ node scripts/server.js

HTTP server is listening on port 3000...
```

Acessar em http://localhost:3000/

Se desejar executar em outra porta, ex. 8080:

```
$ APP_PORT=8080 node scripts/server.js

HTTP server is listening on port 8080...
```

Neste caso, acessar em http://localhost:8080/

## Como executar o build da imagem localmente

Execute o build da imagem:

```
$ docker build -t nodejs-on-k8s .
```

Verifique que a imagem foi criada corretamente:
```
$ docker image ls nodejs-on-k8s

REPOSITORY      TAG       IMAGE ID       CREATED          SIZE
nodejs-on-k8s   latest    ab554e31d5cd   39 minutes ago   151MB
```

Execute um container a partir da imagem:

```
$ docker run -d --rm -p 3000:3000 --name nodejs-on-k8s nodejs-on-k8s
```

Valide que o container está executando:

```
$ curl -i http://localhost:3000/health

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Sun, 23 Jun 2024 21:28:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5

OK
```

A aplicação também deve estar acessível via http://localhost:3000/.

Pare e remova o container:

```
$ docker stop nodejs-on-k8s
```

## Publicar a imagem no GitHub Container Registry

A imagem [já está publicada](https://github.com/users/diegoaltx/packages/container/package/nodejs-on-k8s) e pode ser utilizada como `ghcr.io/diegoaltx/nodejs-on-k8s:latest`. Este é o passo a passo da publicação, mas você não precisa executá-lo para utilizá-la.

```
$ docker login ghcr.io -u diegoaltx

Login Succeeded

$ docker tag nodejs-on-k8s ghcr.io/diegoaltx/nodejs-on-k8s:latest
$ docker push ghcr.io/diegoaltx/nodejs-on-k8s:latest

latest: digest: sha256:5ef32852... size: 1992
```

## Validar o funcionamento da imagem publicada

```
$ docker pull ghcr.io/diegoaltx/nodejs-on-k8s:latest
$ docker run -d --rm -p 3000:3000 --name nodejs-on-k8s ghcr.io/diegoaltx/nodejs-on-k8s:latest
```

Valide que o container está executando:

```
$ curl -i http://localhost:3000/health

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Sun, 23 Jun 2024 21:28:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5

OK
```

A aplicação também deve estar acessível via http://localhost:3000/.

Pare e remova o container:

```
$ docker stop nodejs-on-k8s
```

## Fazer o deploy no Kubernetes

Para testar o deploy em um cluster do Kubernetes foi utilizado o minikube rodando localmente.
Você pode instalá-lo seguindo as [instruções da documentação](https://minikube.sigs.k8s.io/docs/start/).

Para realizar o deploy, aplique as configurações em YAML disponíveis na pasta `k8s/`:

```
$ minikube kubectl -- apply -f k8s/

deployment.apps/nodejs-on-k8s created
service/nodejs-on-k8s created
```

## Validar o deploy da aplicação no Kubernetes

Verifique que todos os recursos (pods, deployment e service) foram criados:

```
$ minikube kubectl -- get service nodejs-on-k8s

NAME            TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
nodejs-on-k8s   NodePort   10.110.122.212   <none>        3000:32369/TCP   2m55s

$ minikube kubectl -- get deployment  nodejs-on-k8s

NAME            READY   UP-TO-DATE   AVAILABLE   AGE
nodejs-on-k8s   1/1     1            1           3m11s

$ minikube kubectl -- get pods --selector=app=nodejs-on-k8s

NAME                             READY   STATUS    RESTARTS   AGE
nodejs-on-k8s-8676f49687-hq8t8   1/1     Running   0          3m28s
```

Testando o serviço via endpoint de health check:

```
$curl -i $(minikube service nodejs-on-k8s --url)/health

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Mon, 24 Jun 2024 00:35:57 GMT
Connection: keep-alive
Keep-Alive: timeout=5

OK
```

Abrindo o serviço no navegador:

```
$ minikube service nodejs-on-k8s

|-----------|---------------|-------------|---------------------------|
| NAMESPACE |     NAME      | TARGET PORT |            URL            |
|-----------|---------------|-------------|---------------------------|
| default   | nodejs-on-k8s |        3000 | http://192.168.49.2:32369 |
|-----------|---------------|-------------|---------------------------|
Opening service default/nodejs-on-k8s in default browser..
```

## Exibindo métricas e logs

Metricas dos pods do serviço:

```
$ minikube kubectl -- top pods --selector=app=nodejs-on-k8s

NAME                             CPU(cores)   MEMORY(bytes)   
nodejs-on-k8s-8676f49687-hq8t8   2m           23Mi 
```

Metricas do cluster:

```
$ minikube kubectl -- top nodes

NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
minikube   137m         1%     637Mi           8% 
```

Logs do serviço:

```
$ minikube kubectl -- logs -f --selector=app=nodejs-on-k8s

::ffff:10.244.0.1 - GET /health HTTP/1.1 200 2 - 0.597 ms
::ffff:10.244.0.1 - GET /health HTTP/1.1 200 2 - 1.025 ms
::ffff:10.244.0.1 - GET /health HTTP/1.1 200 2 - 0.506 ms
...
```
