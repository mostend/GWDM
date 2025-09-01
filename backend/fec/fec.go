package fec

import (
	"math"
	"strconv"
)

type FECService struct{}

type FEC struct {
	PreFEC   string
	Q_Factor string
}

func NewFECService() *FECService {
	return &FECService{}
}

func (f *FECService) Fec2Q_Factor(newFecData FEC) (resultFec FEC) {

	// 将字符串转换成float64
	var newFec, err = strconv.ParseFloat(newFecData.PreFEC, 64)
	if err != nil {
		return FEC{
			PreFEC:   newFecData.PreFEC,
			Q_Factor: "Error: Invalid FEC!",
		}
	}
	var SquareRoot2 = math.Sqrt(2)

	var Q = SquareRoot2 * math.Erfcinv(2*newFec)
	var Q_dB = 20 * math.Log10(Q)

	if math.IsNaN(Q_dB) || math.IsInf(Q_dB, 0) || math.IsNaN(Q) || math.IsInf(Q, 0) {
		return FEC{
			PreFEC:   newFecData.PreFEC,
			Q_Factor: "Error: Invalid FEC!",
		}
	}
	// 将float64转换成字符串
	Q_dB_str := strconv.FormatFloat(Q_dB, 'f', 4, 64)

	return FEC{
		PreFEC:   newFecData.PreFEC,
		Q_Factor: Q_dB_str,
	}
}
