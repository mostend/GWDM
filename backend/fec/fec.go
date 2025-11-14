package fec

import (
	"math"
	"strconv"
)

type FECService struct{}

type FEC struct {
	PreFEC            string
	Q_Factor          string
	EngineeringPreFEC string
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

func (f *FECService) Q_Factor2Fec(newQ_FactorData FEC) (resultFec FEC) {
	// 将字符串转换成float64
	var newQ_Factor, err = strconv.ParseFloat(newQ_FactorData.Q_Factor, 64)
	if err != nil {
		return FEC{
			Q_Factor:          newQ_FactorData.Q_Factor,
			PreFEC:            "Error: Invalid Q_Factor!",
			EngineeringPreFEC: "Error: Invalid Q_Factor!",
		}
	}
	var SquareRoot2 = math.Sqrt(2)

	var Q_liner = math.Pow(10, newQ_Factor/20)

	var newFec = 0.5 * math.Erfc(Q_liner/SquareRoot2)
	newFec_str := strconv.FormatFloat(newFec, 'e', 5, 64)

	var engineeringPreFEC = (1.0 / (math.Sqrt(2*math.Pi) * Q_liner)) * math.Exp(-(Q_liner*Q_liner)/2)
	engineeringPreFEC_str := strconv.FormatFloat(engineeringPreFEC, 'e', 5, 64)

	return FEC{
		PreFEC:            newFec_str,
		Q_Factor:          newQ_FactorData.Q_Factor,
		EngineeringPreFEC: engineeringPreFEC_str,
	}
}
