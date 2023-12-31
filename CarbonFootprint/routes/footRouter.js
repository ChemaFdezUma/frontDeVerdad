const express = require("express");
const router = express.Router();
const axios = require("axios");
router.use(express.json());
const huellaModel = require("../models/huellaModel.js");
const API_KEY = "Xm5gLqrLw95f6ujRVn9tQ";
//LLAMADAS CRUD-------------------------------------------------------------------------------
//Get all, comprobado con Postman
router.get("/", (req, res) => {
    huellaModel
        .find()
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }));
});
//Get, comprobado con Postman
router.get("/:id", (req, res) => {
    const { id } = req.params;
    huellaModel
        .findById(id)
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }));
});
//Create, comprobado con Postman
router.post("/", (req, res) => {
    const huella = huellaModel(req.body);
    huella
        .save()
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }));
});
//Delete, comprobado con Postman
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    huellaModel
        .deleteOne({ _id: id })
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }));
});
//Update, comprobado con Postman
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { distancia, peso, distanciaMIN, distanciaMAX, pesoMIN, pesoMAX } = req.body;
    huellaModel

        .updateOne({ _id: id }, { $set: { distancia, peso, distanciaMIN, distanciaMAX, pesoMIN, pesoMAX } })
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }));
});
//LLAMADAS INTERNAS-------------------------------------------------------------------------------


// Buscar si
//  con los KG, peso  
//  con la DISTANCIA
//   hay algun atributo en la bdd que coincida, es decir, distacia>=distanciaMIN && distancia<=distanciaMAX && peso>=pesoMIN && peso<=pesoMAX
router.get('/huellaCarbono/:distancia/:peso/:transporte', async (req, res) => {
    const { distancia } = req.params;
    const { peso } = req.params;
    huellaModel
        .find({ distanciaMIN: { $lte: distancia }, distanciaMAX: { $gte: distancia }, pesoMIN: { $lte: peso }, pesoMAX: { $gte: peso }, metodoTransporte: req.params.transporte })
        .sort({ distancia: 1 })
        .then((data) => {
            if (data.length === 0) {
                return res.json({ message: "No se ha encontrado ningún producto con esos datos." });
            }
            res.json(data[0]);
        })
        .catch((error) => res.json({ message: error }));


});


// Calcular huella carbono en G para repartos de productos en camion
//     params:
//     idUsuario es comprador,
//     idProducto es el producto que desea comprar
// comprobado con Postman
router.get('/huellaCarbonoCostoCamion/:idUsuario/:idProducto', async (req, res) => {
    axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasUsuario/' + req.params.idUsuario).then((respuesta) => {
        const latitudUsuario = respuesta.data.latitud;
        const longitudUsuario = respuesta.data.longitud;
        
        axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasProducto/' + req.params.idProducto).then((respuesta) => {

            const latitudProducto = respuesta.data.latitud;
            const longitudProducto = respuesta.data.longitud;
            axios.get('https://el-rastro-six.vercel.app/mapa/distancia/' + latitudUsuario + '/' + longitudUsuario + '/' + latitudProducto + '/' + longitudProducto).then((respuesta) => {

                const distancia = respuesta.data.distance;
                axios.get('https://el-rastro-six.vercel.app/productos/' + req.params.idProducto).then((respuesta) => {
                    const peso = respuesta.data.peso;
                    axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbono/' + distancia + '/' + peso + '/camion').then((respuesta) => {
                        if (respuesta.data.length !== 0 && respuesta.data.message !== "No se ha encontrado ningún producto con esos datos.") {
                            res.json(respuesta.data.huella);
                        } else {
                            //Agregar a la bdd
                            const options = {
                                url: "https://www.carboninterface.com/api/v1/estimates",
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${API_KEY}`,
                                    ContentType: "application/json",
                                },
                                data: {
                                    type: "shipping",
                                    weight_value: peso,
                                    weight_unit: "g",
                                    distance_value: distancia / 1000,
                                    distance_unit: "km",
                                    transport_method: "truck",
                                },
                            };
                            axios(options)
                                .then((response) => {
                                    // {
                                    //     data: {
                                    //       id: 'ad793815-eb17-43b8-bb68-73b8f4a0323b',
                                    //       type: 'estimate',
                                    //       attributes: {
                                    //         distance_value: 157,
                                    //         weight_unit: 'g',
                                    //         transport_method: 'truck',
                                    //         weight_value: 100,
                                    //         distance_unit: 'km',
                                    //         estimated_at: '2023-11-11T14:21:19.992Z',
                                    //         carbon_g: 1,
                                    //         carbon_lb: 0,
                                    //         carbon_kg: 0,
                                    //         carbon_mt: 0
                                    //       }
                                    //     }
                                    //   }
                                    //Accedemos a los g de carbono
                                    const carbonFootprint = response.data.data.attributes.carbon_g;
                                    axios.post('https://el-rastro-six.vercel.app/huellaC/', {
                                        distancia: distancia,
                                        peso: peso,
                                        distanciaMIN: distancia - 10,
                                        distanciaMAX: distancia + 10,
                                        pesoMIN: peso - 2000,
                                        pesoMAX: peso + 2000,
                                        huella: carbonFootprint,
                                        metodoTransporte: "camion"
                                    })
                                    res.json({ carbonFootprint });

                                })
                                .catch((error) => {
                                    res.json({ message: error });
                                });

                        }
                    })
                }).catch((error) => {
                    res.json({ message: error });
                })
            }).catch((error) => {
                res.json({ message: error });
            })
        })
    })
});

router.get('/huellaCarbonoCostoAvion/:idUsuario/:idProducto', async (req, res) => {
    axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasUsuario/' + req.params.idUsuario).then((respuesta) => {
        const latitudUsuario = respuesta.data.latitud;
        const longitudUsuario = respuesta.data.longitud;
        axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasProducto/' + req.params.idProducto).then((respuesta) => {
            const latitudProducto = respuesta.data.latitud;
            const longitudProducto = respuesta.data.longitud;
            axios.get('https://el-rastro-six.vercel.app/mapa/distancia/' + latitudUsuario + '/' + longitudUsuario + '/' + latitudProducto + '/' + longitudProducto).then((respuesta) => {
                
                const distancia = respuesta.data.distance;
                axios.get('https://el-rastro-six.vercel.app/productos/' + req.params.idProducto).then((respuesta) => {
                    const peso = respuesta.data.peso;
                    axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbono/' + distancia + '/' + peso + '/avion').then((respuesta) => {
                        if (respuesta.data.length !== 0 && respuesta.data.message !== "No se ha encontrado ningún producto con esos datos.") {
                            res.json(respuesta.data.huella);
                        } else {
                            //Agregar a la bdd
                            const options = {
                                url: "https://www.carboninterface.com/api/v1/estimates",
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${API_KEY}`,
                                    ContentType: "application/json",
                                },
                                data: {
                                    type: "shipping",
                                    weight_value: peso,
                                    weight_unit: "g",
                                    distance_value: distancia / 1000,
                                    distance_unit: "km",
                                    transport_method: "plane",
                                },
                            };
                            axios(options)
                                .then((response) => {
                                    // {
                                    //     data: {
                                    //       id: 'ad793815-eb17-43b8-bb68-73b8f4a0323b',
                                    //       type: 'estimate',
                                    //       attributes: {
                                    //         distance_value: 157,
                                    //         weight_unit: 'g',
                                    //         transport_method: 'truck',
                                    //         weight_value: 100,
                                    //         distance_unit: 'km',
                                    //         estimated_at: '2023-11-11T14:21:19.992Z',
                                    //         carbon_g: 1,
                                    //         carbon_lb: 0,
                                    //         carbon_kg: 0,
                                    //         carbon_mt: 0
                                    //       }
                                    //     }
                                    //   }
                                    //Accedemos a los g de carbono
                                    const carbonFootprint = response.data.data.attributes.carbon_g;

                                    res.json({ carbonFootprint });
                                    axios.post('https://el-rastro-six.vercel.app/huellaC/', {
                                        distancia: distancia,
                                        peso: peso,
                                        distanciaMIN: distancia - 10,
                                        distanciaMAX: distancia + 10,
                                        pesoMIN: peso - 2000,
                                        pesoMAX: peso + 2000,
                                        huella: carbonFootprint,
                                        metodoTransporte: "avion"
                                    })
                                })
                                .catch((error) => {
                                    res.json({ message: error });
                                });

                        }
                    })
                }).catch((error) => {
                    res.json({ message: error });
                })
            })
        })
    })
});

router.get('/huellaCarbonoCostoBarco/:idUsuario/:idProducto', async (req, res) => {
    axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasUsuario/' + req.params.idUsuario).then((respuesta) => {
        const latitudUsuario = respuesta.data.latitud;
        const longitudUsuario = respuesta.data.longitud;
        axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasProducto/' + req.params.idProducto).then((respuesta) => {
            const latitudProducto = respuesta.data.latitud;
            const longitudProducto = respuesta.data.longitud;
            axios.get('https://el-rastro-six.vercel.app/mapa/distancia/' + latitudUsuario + '/' + longitudUsuario + '/' + latitudProducto + '/' + longitudProducto).then((respuesta) => {

                const distancia = respuesta.data.distance;
                axios.get('https://el-rastro-six.vercel.app/productos/' + req.params.idProducto).then((respuesta) => {
                    const peso = respuesta.data.peso;
                    axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbono/' + distancia + '/' + peso + '/barco').then((respuesta) => {
                        if (respuesta.data.length !== 0 && respuesta.data.message !== "No se ha encontrado ningún producto con esos datos.") {
                            res.json(respuesta.data.huella);
                        } else {
                            //Agregar a la bdd
                            const options = {
                                url: "https://www.carboninterface.com/api/v1/estimates",
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${API_KEY}`,
                                    ContentType: "application/json",
                                },
                                data: {
                                    type: "shipping",
                                    weight_value: peso,
                                    weight_unit: "g",
                                    distance_value: distancia / 1000,
                                    distance_unit: "km",
                                    transport_method: "ship",
                                },
                            };
                            axios(options)
                                .then((response) => {
                                    // {
                                    //     data: {
                                    //       id: 'ad793815-eb17-43b8-bb68-73b8f4a0323b',
                                    //       type: 'estimate',
                                    //       attributes: {
                                    //         distance_value: 157,
                                    //         weight_unit: 'g',
                                    //         transport_method: 'truck',
                                    //         weight_value: 100,
                                    //         distance_unit: 'km',
                                    //         estimated_at: '2023-11-11T14:21:19.992Z',
                                    //         carbon_g: 1,
                                    //         carbon_lb: 0,
                                    //         carbon_kg: 0,
                                    //         carbon_mt: 0
                                    //       }
                                    //     }
                                    //   }
                                    //Accedemos a los g de carbono
                                    const carbonFootprint = response.data.data.attributes.carbon_g;

                                    res.json({ carbonFootprint });
                                    axios.post('https://el-rastro-six.vercel.app/huellaC/', {
                                        distancia: distancia,
                                        peso: peso,
                                        distanciaMIN: distancia - 10,
                                        distanciaMAX: distancia + 10,
                                        pesoMIN: peso - 2000,
                                        pesoMAX: peso + 2000,
                                        huella: carbonFootprint,
                                        metodoTransporte: "barco"
                                    })
                                })
                                .catch((error) => {
                                    res.json({ message: error });
                                });

                        }
                    })
                }).catch((error) => {
                    res.json({ message: error });
                })
            })
        })
    })
});

router.get('/huellaCarbonoCostoTren/:idUsuario/:idProducto', async (req, res) => {
    axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasUsuario/' + req.params.idUsuario).then((respuesta) => {
        const latitudUsuario = respuesta.data.latitud;
        const longitudUsuario = respuesta.data.longitud;
        axios.get('https://el-rastro-six.vercel.app/mapa/coordenadasProducto/' + req.params.idProducto).then((respuesta) => {
            const latitudProducto = respuesta.data.latitud;
            const longitudProducto = respuesta.data.longitud;
            axios.get('https://el-rastro-six.vercel.app/mapa/distancia/' + latitudUsuario + '/' + longitudUsuario + '/' + latitudProducto + '/' + longitudProducto).then((respuesta) => {

                const distancia = respuesta.data.distance;
                axios.get('https://el-rastro-six.vercel.app/productos/' + req.params.idProducto).then((respuesta) => {
                    const peso = respuesta.data.peso;
                    axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbono/' + distancia + '/' + peso + '/tren').then((respuesta) => {
                        if (respuesta.data.length !== 0 && respuesta.data.message !== "No se ha encontrado ningún producto con esos datos.") {
                            res.json(respuesta.data.huella);
                        } else {
                            //Agregar a la bdd
                            const options = {
                                url: "https://www.carboninterface.com/api/v1/estimates",
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${API_KEY}`,
                                    ContentType: "application/json",
                                },
                                data: {
                                    type: "shipping",
                                    weight_value: peso,
                                    weight_unit: "g",
                                    distance_value: distancia / 1000,
                                    distance_unit: "km",
                                    transport_method: "train",
                                },
                            };
                            axios(options)
                                .then((response) => {
                                    // {
                                    //     data: {
                                    //       id: 'ad793815-eb17-43b8-bb68-73b8f4a0323b',
                                    //       type: 'estimate',
                                    //       attributes: {
                                    //         distance_value: 157,
                                    //         weight_unit: 'g',
                                    //         transport_method: 'truck',
                                    //         weight_value: 100,
                                    //         distance_unit: 'km',
                                    //         estimated_at: '2023-11-11T14:21:19.992Z',
                                    //         carbon_g: 1,
                                    //         carbon_lb: 0,
                                    //         carbon_kg: 0,
                                    //         carbon_mt: 0
                                    //       }
                                    //     }
                                    //   }
                                    //Accedemos a los g de carbono
                                    const carbonFootprint = response.data.data.attributes.carbon_g;

                                    res.json({ carbonFootprint });
                                    axios.post('https://el-rastro-six.vercel.app/huellaC/', {
                                        distancia: distancia,
                                        peso: peso,
                                        distanciaMIN: distancia - 10,
                                        distanciaMAX: distancia + 10,
                                        pesoMIN: peso - 2000,
                                        pesoMAX: peso + 2000,
                                        huella: carbonFootprint,
                                        metodoTransporte: "tren"
                                    })
                                })
                                .catch((error) => {
                                    res.json({ message: error });
                                });

                        }
                    })
                }).catch((error) => {
                    res.json({ message: error });
                })
            })
        })
    })
});

router.get('/calcularHuella/:idUsuario/:idProducto/:transporte', async (req, res) => {
    console.log(req.params.transporte);
    const {idUsuario, idProducto, transporte} = req.params;

    if(transporte == "camion"){
        axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbonoCostoCamion/' + idUsuario + '/' + idProducto).then((respuesta) => {
            console.log(respuesta.data);
            res.json(respuesta.data);
        }).catch((error) => {
            res.json({ message: error });
        })
    }else if(transporte == "avion"){
        axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbonoCostoAvion/' + idUsuario + '/' + idProducto).then((respuesta) => {
            res.json(respuesta.data);
        }).catch((error) => {
            res.json({ message: error });
        })
    }else if(transporte == "barco"){
        axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbonoCostoBarco/' + idUsuario + '/' + idProducto).then((respuesta) => {
            
            res.json(respuesta.data);
        }).catch((error) => {
            res.json({ message: error });
        })
    }else if(transporte == "tren"){
        axios.get('https://el-rastro-six.vercel.app/huellaC/huellaCarbonoCostoTren/' + idUsuario + '/' + idProducto).then((respuesta) => {
            res.json(respuesta.data);
        }).catch((error) => {
            res.json({ message: error });
        })
    }else{
        res.json({message: "El transporte no es válido"})
    }

})
//Calcular precio de huella carbono en euros
router.get("/getPrecio/:cantidadEnGramos", (req, res) => {
    console.log(req.params);
    const { cantidadEnGramos } = req.params;
    res.json({ precio: cantidadEnGramos * 0.01 });
});


module.exports = router;


